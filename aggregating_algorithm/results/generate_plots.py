import json
import matplotlib.pyplot as plt
import numpy as np
import os
from scipy.stats import binom

PREFIXES = []
for length in range(1, 5):
    for i in range(2**length):
        binary_string = format(i, f"0{length}b")
        PREFIXES.append(binary_string)

DIRECTORY = 'data'

FILES = []
for file in os.listdir(DIRECTORY):
    FILES.append(file)

for file in FILES:
    with open(f"{DIRECTORY}/{file}", "r") as f:
        data = json.load(f)

    CUMULATIVE_EXPERTS_LOSSES = np.array(data["cumulativeExpertsLosses"][:-1])
    CUMULATIVE_LEARNER_LOSS = np.array(data["cumulativeLearnerLoss"][:-1])

    T = len(CUMULATIVE_LEARNER_LOSS)
    NUM_EXPERTS = len(CUMULATIVE_EXPERTS_LOSSES[0])
    AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * np.log(NUM_EXPERTS)

    plt.figure(figsize=(10, 10))
    for i in range(len(CUMULATIVE_EXPERTS_LOSSES[0])):
        plt.plot(
            np.arange(T),
            CUMULATIVE_EXPERTS_LOSSES[:, i] - CUMULATIVE_LEARNER_LOSS,
            label=f"$\\text{{Loss}}_{{E_{{'{PREFIXES[i]}'}}}}(t) - \\text{{Loss}}_L(t)$",
        )
    plt.axhline(y=0, color="black", linestyle="-")
    plt.axhline(y=AGGREGATING_ALGORITHM_BOUND, color="black", linestyle="--")
    plt.title("Differences of Cumulative Losses vs. Time")
    plt.xlabel("Time Step")
    plt.ylabel("Loss")
    plt.savefig(f"{os.path.splitext(file)[0]}_differences.jpg", format="jpg")

    NUMBER_OF_HEADS = {i: 0 for i in range(11)}
    NUMBER_OF_RUNS = {i: 0 for i in range(1, 11)}
    SEQUENCES = data["sequences"]

    for sequence in SEQUENCES:
        heads = sequence.count("1")
        NUMBER_OF_HEADS[heads] += 1
        runs = 1
        last_bit = sequence[0]

        for bit in sequence[1:]:
            if bit != last_bit:
                runs += 1
            last_bit = bit
        
        NUMBER_OF_RUNS[runs] += 1

    BINS = np.arange(0, 11)
    TOTAL_SEQUENCES = len(SEQUENCES)
    ACTUAL_DISTRIBUTION = [(NUMBER_OF_HEADS[i] / TOTAL_SEQUENCES) * 100 for i in range(11)]
    THEORETICAL_DISTRIBUTION = binom.pmf(BINS, 10, 0.5) * 100
    plt.figure(figsize=(10, 10))
    plt.bar(
        BINS + 0.2,
        THEORETICAL_DISTRIBUTION,
        width=0.4,
        label="Theoretical",
        color="#C6C6C6",
        edgecolor="black",
        alpha=0.75,
    )
    plt.bar(
        BINS - 0.2,
        ACTUAL_DISTRIBUTION,
        width=0.4,
        label="Actual",
        color="#929292",
        edgecolor="black",
        alpha=0.75,
    )
    plt.xlabel("Number of Heads $(n)$")
    plt.ylabel("Percentage of Sequences")
    plt.grid(axis='y')
    plt.legend()
    plt.savefig(f"{os.path.splitext(file)[0]}_number_of_heads.jpg", format="jpg")

    BINS = np.arange(1, 11)
    TOTAL_SEQUENCES = len(SEQUENCES)
    ACTUAL_DISTRIBUTION = [(NUMBER_OF_RUNS[i] / TOTAL_SEQUENCES) * 100 for i in BINS]
    THEORETICAL_DISTRIBUTION = binom.pmf(BINS - 1, 9, 0.5) * 100
    plt.figure(figsize=(10, 10))
    plt.bar(
        BINS + 0.2,
        THEORETICAL_DISTRIBUTION,
        width=0.4,
        label="Theoretical",
        color="#C6C6C6",
        edgecolor="black",
        alpha=0.75,
    )
    plt.bar(
        BINS - 0.2,
        ACTUAL_DISTRIBUTION,
        width=0.4,
        label="Actual",
        color="#929292",
        edgecolor="black",
        alpha=0.75,
    )
    plt.xlabel("Number of Runs $(r)$")
    plt.ylabel("Percentage of Sequences")
    plt.grid(axis='y')
    plt.legend()
    plt.savefig(f"{os.path.splitext(file)[0]}_number_of_runs.jpg", format="jpg")

