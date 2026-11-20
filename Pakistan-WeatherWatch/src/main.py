import subprocess
import sys

steps = [
    ("EXTRACTION", "src.extract"),
    ("TRANSFORMATION", "src.transform"),
    ("DATA LOADING", "src.load"),
    ("EXPLORATORY DATA ANALYSIS", "src.eda")
]

for step_name, module_name in steps:

    print(f"\n---------- {step_name} ----------")

    result = subprocess.run(
        [sys.executable, "-m", module_name],
        check=False
    )

    if result.returncode != 0:
        print(f"\nPipeline stopped: {step_name} failed.")
        sys.exit(result.returncode)

print("\n---------- WEATHERWATCH PIPELINE COMPLETED ----------")
