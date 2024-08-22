import json
import matplotlib.pyplot as plt
import numpy as np
import os
import scipy.stats as stats

DIRECTORY = "data"
FILES = sorted([file for file in os.listdir(DIRECTORY)])

file_names = []
correct_counts = []
incorrect_counts = []

for i, file in enumerate(FILES):
    with open(f"{DIRECTORY}/{file}", "r") as f:
        data = json.load(f)

    OUTCOMES = [int(item) for sublist in data["sequences"] for item in sublist]
    RAW_LEARNER_PREDICTIONS = data["learnerPredictions"]
    CASTED_LEARNER_PREDICTIONS = [round(prediction) for prediction in RAW_LEARNER_PREDICTIONS]

    COMPARISON = [outcome == prediction for outcome, prediction in zip(OUTCOMES, CASTED_LEARNER_PREDICTIONS)]

    CORRECT_COUNT = sum(COMPARISON)
    INCORRECT_COUNT = len(COMPARISON) - CORRECT_COUNT
    ACCURACY = CORRECT_COUNT / len(COMPARISON)

    file_names.append(f"Subject {i + 1}\n({ACCURACY*100:.2f}%)")
    correct_counts.append(CORRECT_COUNT)
    incorrect_counts.append(INCORRECT_COUNT)

x = np.arange(len(file_names))
width = 0.4

fig, ax = plt.subplots(figsize=(10,5))
correct_bars = ax.bar(
    x - width / 2,
    correct_counts,
    width,
    label="Correct $\gamma_t$",
    color="#C6C6C6",
    edgecolor="black",
    alpha=0.75,
)
incorrect_bars = ax.bar(
    x + width / 2,
    incorrect_counts,
    width,
    label="Incorrect $\gamma_t$",
    color="#929292",
    edgecolor="black",
    alpha=0.75,
)

ax.set_ylabel("Count")
ax.set_xticks(x)
ax.set_xticklabels(file_names, ha="center", fontsize=12)
ax.grid(axis="y")
ax.legend(fontsize=12)
plt.savefig(f"prediction_results.jpg", format="jpg")
# plt.show()

    # print(f"{file}: {sum(COMPARISON)} Correct | {len(COMPARISON) - sum(COMPARISON)} Incorrect | ({round(sum(COMPARISON) / len(COMPARISON), 2) * 100}%)")

