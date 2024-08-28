import json
import matplotlib.pyplot as plt
import numpy as np
import os

DIRECTORY = "data"
FILES = sorted([file for file in os.listdir(DIRECTORY)])

file_names = []
correct_counts = []
incorrect_counts = []

for i, file in enumerate(FILES):
    with open(f"{DIRECTORY}/{file}", "r") as f:
        data = json.load(f)

    OUTCOMES = [int(item) for sublist in data["sequences"] for item in sublist][1:]
    RAW_LEARNER_PREDICTIONS = data["learnerPredictions"]
    CASTED_LEARNER_PREDICTIONS = [
        round(prediction) for prediction in RAW_LEARNER_PREDICTIONS
    ][:-1]
    CASTED_LEARNER_PREDICTIONS.insert(0, 0)

    COMPARISON = [
        outcome == prediction
        for outcome, prediction in zip(OUTCOMES, CASTED_LEARNER_PREDICTIONS)
    ]

    CORRECT_COUNT = sum(COMPARISON)
    INCORRECT_COUNT = len(COMPARISON) - CORRECT_COUNT
    ACCURACY = CORRECT_COUNT / len(COMPARISON)

    file_names.append(f"Subject {i + 1}\n({ACCURACY*100:.2f}%)")
    correct_counts.append(CORRECT_COUNT)
    incorrect_counts.append(INCORRECT_COUNT)
    print(
        f"{file}: {sum(COMPARISON)} Correct | {len(COMPARISON) - sum(COMPARISON)} Incorrect | {ACCURACY*100:.2f}%"
    )

x = np.arange(len(file_names))
WIDTH = 0.4

fig, ax = plt.subplots(figsize=(10, 5))
correct_bars = ax.bar(
    x - WIDTH / 2,
    correct_counts,
    WIDTH,
    label="Correct $\gamma_t$",
    color="#C6C6C6",
    edgecolor="black",
    alpha=0.75,
)
incorrect_bars = ax.bar(
    x + WIDTH / 2,
    incorrect_counts,
    WIDTH,
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
plt.savefig("prediction_results.jpg", format="jpg")
