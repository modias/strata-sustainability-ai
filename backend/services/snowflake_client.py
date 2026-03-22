import json
import logging
import os
import uuid

import snowflake.connector

logger = logging.getLogger(__name__)

_conn = None


def get_connection():
    global _conn

    try:
        if _conn is not None and not _conn.is_closed():
            return _conn

        account = os.environ.get("SNOWFLAKE_ACCOUNT")
        user = os.environ.get("SNOWFLAKE_USER")
        password = os.environ.get("SNOWFLAKE_PASSWORD")
        database = os.environ.get("SNOWFLAKE_DATABASE")
        schema = os.environ.get("SNOWFLAKE_SCHEMA")
        warehouse = os.environ.get("SNOWFLAKE_WAREHOUSE")

        if _conn is not None:
            try:
                _conn.close()
            except Exception:
                pass
            _conn = None

        _conn = snowflake.connector.connect(
            account=account,
            user=user,
            password=password,
            database=database,
            schema=schema,
            warehouse=warehouse,
        )
        return _conn
    except Exception as e:
        logger.exception("Snowflake connection failed: %s", e)
        _conn = None
        return None


def save_verdict(
    target: str,
    mode: str,
    final_score: float,
    verdict: str,
    trajectory: str,
    agent_scores: list,
    judge_output: dict,
    entity_id: str,
):
    cursor = None
    try:
        record_id = str(uuid.uuid4())
        conn = get_connection()
        if conn is None:
            logger.warning("save_verdict: Snowflake connection unavailable")
            return None

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO verdicts
                (id, entity_id, target, mode, final_score, verdict,
                 trajectory, dissent_score, agent_scores_json, judge_output_json)
            SELECT %s, %s, %s, %s, %s, %s, %s, %s,
                   PARSE_JSON(%s),
                   PARSE_JSON(%s)
            """,
            (
                record_id,
                entity_id,
                target,
                mode,
                final_score,
                verdict,
                trajectory,
                final_score,
                json.dumps(agent_scores),
                json.dumps(judge_output),
            ),
        )
        conn.commit()
        return record_id
    except Exception as e:
        logger.exception("save_verdict failed: %s", e)
        return None
    finally:
        if cursor is not None:
            cursor.close()


def get_verdict_history(entity_id: str) -> list:
    cursor = None
    try:
        conn = get_connection()
        if conn is None:
            return []

        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT verdict, final_score, trajectory, dissent_score, created_at
            FROM verdicts
            WHERE entity_id = %s
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (entity_id,),
        )
        rows = cursor.fetchall()
        keys = ("verdict", "final_score", "trajectory", "dissent_score", "created_at")
        return [dict(zip(keys, row)) for row in rows]
    except Exception as e:
        logger.exception("get_verdict_history failed: %s", e)
        return []
    finally:
        if cursor is not None:
            cursor.close()


def save_cv_results(entity_id: str, cv_profile: dict) -> bool:
    cursor = None
    try:
        conn = get_connection()
        if conn is None:
            logger.warning("save_cv_results: Snowflake connection unavailable")
            return False

        green_coverage_pct = cv_profile.get("green_coverage_pct", 0.0)
        impervious_surface_pct = cv_profile.get("impervious_surface_pct", 0.0)
        heat_intensity_score = cv_profile.get("heat_intensity_score", 0.0)
        ndvi_mean = cv_profile.get("ndvi_mean", 0.0)
        fragmentation_score = cv_profile.get("fragmentation_score", 0.0)
        cv_profile_json_string = json.dumps(cv_profile)

        cursor = conn.cursor()
        cursor.execute(
            """
            MERGE INTO cv_results USING (SELECT %s AS entity_id) AS src
            ON cv_results.entity_id = src.entity_id
            WHEN MATCHED THEN UPDATE SET
              green_coverage_pct = %s,
              impervious_surface_pct = %s,
              heat_intensity_score = %s,
              ndvi_mean = %s,
              fragmentation_score = %s,
              full_cv_json = PARSE_JSON(%s),
              created_at = CURRENT_TIMESTAMP()
            WHEN NOT MATCHED THEN INSERT
              (entity_id, green_coverage_pct, impervious_surface_pct,
               heat_intensity_score, ndvi_mean, fragmentation_score, full_cv_json)
            VALUES (%s, %s, %s, %s, %s, %s, PARSE_JSON(%s))
            """,
            (
                entity_id,
                green_coverage_pct,
                impervious_surface_pct,
                heat_intensity_score,
                ndvi_mean,
                fragmentation_score,
                cv_profile_json_string,
                entity_id,
                green_coverage_pct,
                impervious_surface_pct,
                heat_intensity_score,
                ndvi_mean,
                fragmentation_score,
                cv_profile_json_string,
            ),
        )
        conn.commit()
        return True
    except Exception as e:
        logger.exception("save_cv_results failed: %s", e)
        return False
    finally:
        if cursor is not None:
            cursor.close()


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()

    # Test save_cv_results
    test_cv = {
        "green_coverage_pct": 18.0,
        "impervious_surface_pct": 74.0,
        "heat_intensity_score": 3.2,
        "ndvi_mean": 0.24,
        "fragmentation_score": 0.65,
    }
    result = save_cv_results("anacostia_test", test_cv)
    print("save_cv_results:", result)  # Should print True

    history = get_verdict_history("anacostia_test")
    print("get_verdict_history:", history)
