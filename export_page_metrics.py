"""Run the weekly page-visits query on owbdb and save the result to Excel.

Usage:
    export PGUSER=<your db user>
    export PGPASSWORD=<your db password>
    python3 export_page_metrics.py [output.xlsx]

Requires: pip install psycopg2-binary pandas openpyxl
"""
import os
import sys
from datetime import date

import pandas as pd
import psycopg2

HOST = "ps-rg-owb-prod-01.postgres.database.azure.com"
PORT = 5432
DBNAME = "owbdb"

QUERY = """
WITH cleaned_metrics AS (
    SELECT
        EXTRACT(YEAR FROM begin_time)::int AS year,
        EXTRACT(WEEK FROM begin_time)::int AS week,
        CASE
            WHEN page_url LIKE '%%/chat%%' THEN 'chat'
            WHEN page_url LIKE '%%/workbench/%%' THEN SPLIT_PART(page_url, '/workbench/', 2)
            WHEN page_url LIKE '%%io/' THEN 'home'
            ELSE page_url
        END AS page
    FROM page_metrics
    WHERE
        user_id NOT IN (
            'abdullah.safwi@maersk.com',
            'deya.hazra@maersk.com',
            'gowrish.mallipattana@maersk.com',
            'mayank.gupta@maersk.com',
            'sraddhanand.c@maersk.com',
            'lakshay.jain@maersk.com',
            'aditya.mishra@maersk.com',
            'asha.ba@maersk.com',
            'nilesh.chakkar@maersk.com',
            'sandeep.s.1@maersk.com',
            'sibasis.mishra@maersk.com',
            'ameetpal.singh@maersk.com',
            'amal.saxena@maersk.com',
            'nishant.r.mishra@maersk.com',
            'binay.ray@maersk.com',
            'bhargav.k.k@maersk.com',
            'prachi.khirolkar@maersk.com',
            'sandeep.shah1@maersk.com'
        )
        AND end_time IS NOT NULL
        AND begin_time >= TIMESTAMP '2026-06-01 00:00:00'
        AND begin_time <  (CURRENT_DATE + INTERVAL '1 day')
)
SELECT year, week, page, COUNT(*) AS visits
FROM cleaned_metrics
GROUP BY year, week, page
ORDER BY year DESC, week DESC, visits DESC;
"""


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else f"page_metrics_{date.today():%Y%m%d}.xlsx"

    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        user=os.environ["PGUSER"],
        password=os.environ["PGPASSWORD"],
        sslmode="require",
    )
    try:
        with conn.cursor() as cur:
            cur.execute(QUERY)
            columns = [c.name for c in cur.description]
            df = pd.DataFrame(cur.fetchall(), columns=columns)
    finally:
        conn.close()

    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="page_metrics", index=False)
        ws = writer.sheets["page_metrics"]
        ws.freeze_panes = "A2"
        for col in ws.columns:
            width = max(len(str(cell.value)) if cell.value is not None else 0 for cell in col)
            ws.column_dimensions[col[0].column_letter].width = min(width + 2, 80)

    print(f"Saved {len(df)} rows to {os.path.abspath(out_path)}")


if __name__ == "__main__":
    main()
