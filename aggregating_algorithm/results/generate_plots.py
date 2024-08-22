import json
import matplotlib.pyplot as plt
import numpy as np
import os
from scipy.stats import binom

def count_runs(sequence):
    if not sequence:
        return []
    
    run_lengths = []
    current_run_length = 1
    
    for i in range(1, len(sequence)):
        if sequence[i] == sequence[i - 1]:
            current_run_length += 1
        else:
            run_lengths.append(current_run_length)
            current_run_length = 1
    
    run_lengths.append(current_run_length)
    
    return run_lengths

PREFIXES = []
for length in range(1, 5):
    for i in range(2**length):
        binary_string = format(i, f"0{length}b")
        PREFIXES.append(binary_string)

DIRECTORY = "data"

FILES = [file for file in os.listdir(DIRECTORY)]
COMBINED_NUMBER_OF_HEADS = {i: 0 for i in range(11)}
COMBINED_NUMBER_OF_RUNS = {i: 0 for i in range(1, 11)}
COMBINED_LENGTH_OF_RUNS = {i: 0 for i in range(1, 11)}
combined_length = 0

for file in FILES:
    with open(f"{DIRECTORY}/{file}", "r") as f:
        data = json.load(f)

    CUMULATIVE_EXPERTS_LOSSES = np.array(data["cumulativeExpertsLosses"][:-1])
    CUMULATIVE_LEARNER_LOSS = np.array(data["cumulativeLearnerLoss"][:-1])

    T = len(CUMULATIVE_LEARNER_LOSS)
    NUM_EXPERTS = len(CUMULATIVE_EXPERTS_LOSSES[0])
    AGGREGATING_ALGORITHM_BOUND = -(1.0 / 2.0) * np.log(NUM_EXPERTS)

    plt.figure(figsize=(5, 5))
    print(file)
    for i in range(len(CUMULATIVE_EXPERTS_LOSSES[0])):
        print(f"Expert {PREFIXES[i]} - Learner: {CUMULATIVE_EXPERTS_LOSSES[:, i][-1] - CUMULATIVE_LEARNER_LOSS[-1]}")
        plt.plot(
            np.arange(T),
            CUMULATIVE_EXPERTS_LOSSES[:, i] - CUMULATIVE_LEARNER_LOSS,
            label=f"$\\text{{Loss}}_{{E_{{'{PREFIXES[i]}'}}}}(t) - \\text{{Loss}}_L(t)$",
        )
    plt.axhline(y=0, color="black", linestyle="-")
    plt.axhline(y=AGGREGATING_ALGORITHM_BOUND, color="black", linestyle="--")
    plt.title("Differences of Cumulative Losses vs. Time")
    plt.xlabel("Time Step", fontsize=15)
    plt.ylabel("Loss", fontsize=15)
    plt.savefig(f"{os.path.splitext(file)[0]}_differences.jpg", format="jpg")
    plt.close()

    NUMBER_OF_HEADS = {i: 0 for i in range(11)}
    NUMBER_OF_RUNS = {i: 0 for i in range(1, 11)}
    LENGTH_OF_RUNS = {i: 0 for i in range(1, 11)}
    SEQUENCES = data["sequences"]
    combined_length += len(SEQUENCES)
    for sequence in SEQUENCES:
        run_lengths = count_runs(sequence)
        for length in run_lengths:
            LENGTH_OF_RUNS[length] += 1
            COMBINED_LENGTH_OF_RUNS[length] += 1

        heads = sequence.count("1")
        NUMBER_OF_HEADS[heads] += 1
        COMBINED_NUMBER_OF_HEADS[heads] += 1
        runs = 1
        last_bit = sequence[0]

        for bit in sequence[1:]:
            if bit != last_bit:
                runs += 1
            last_bit = bit

        NUMBER_OF_RUNS[runs] += 1
        COMBINED_NUMBER_OF_RUNS[runs] += 1

    # Number of Heads for Individual Results
    BINS = np.arange(0, 11)
    TOTAL_SEQUENCES = len(SEQUENCES)
    ACTUAL_DISTRIBUTION = [
        (NUMBER_OF_HEADS[i] / TOTAL_SEQUENCES) * 100 for i in range(11)
    ]
    THEORETICAL_DISTRIBUTION = binom.pmf(BINS, 10, 0.5) * 100
    plt.figure(figsize=(5, 5))
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
    plt.xlabel("Number of Heads $(n)$", fontsize=15)
    plt.ylabel("Percentage of Sequences", fontsize=15)
    plt.grid(axis="y")
    plt.legend(fontsize=15)
    plt.savefig(f"{os.path.splitext(file)[0]}_number_of_heads.jpg", format="jpg")
    plt.close()

    # Number of Runs for Individual Files
    BINS = np.arange(1, 11)
    TOTAL_SEQUENCES = len(SEQUENCES)
    ACTUAL_DISTRIBUTION = [(NUMBER_OF_RUNS[i] / TOTAL_SEQUENCES) * 100 for i in BINS]
    THEORETICAL_DISTRIBUTION = binom.pmf(BINS - 1, 9, 0.5) * 100
    plt.figure(figsize=(5, 5))
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
    plt.xlabel("Number of Runs $(r)$", fontsize=15)
    plt.ylabel("Percentage of Sequences", fontsize=15)
    plt.grid(axis="y")
    plt.legend(fontsize=15)
    plt.savefig(f"{os.path.splitext(file)[0]}_number_of_runs.jpg", format="jpg")
    plt.close()

# Number of Heads for Combined Results
BINS = np.arange(0, 11)
TOTAL_SEQUENCES = combined_length
ACTUAL_DISTRIBUTION = [
    (COMBINED_NUMBER_OF_HEADS[i] / TOTAL_SEQUENCES) * 100 for i in range(11)
]
THEORETICAL_DISTRIBUTION = binom.pmf(BINS, 10, 0.5) * 100
plt.figure(figsize=(10, 5))
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
plt.xticks(np.arange(0, 11, 1))
plt.xlabel("Number of Heads $(n)$", fontsize=15)
plt.ylabel("Percentage of Sequences", fontsize=15)
plt.grid(axis="y")
plt.legend(fontsize=15)
plt.savefig(f"combined_number_of_heads.jpg", format="jpg")
plt.close()

# Number of Runs for Combined Results
BINS = np.arange(1, 11)
TOTAL_SEQUENCES = combined_length
ACTUAL_DISTRIBUTION = [
    (COMBINED_NUMBER_OF_RUNS[i] / TOTAL_SEQUENCES) * 100 for i in BINS
]
THEORETICAL_DISTRIBUTION = binom.pmf(BINS - 1, 9, 0.5) * 100
plt.figure(figsize=(10, 5))
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
plt.xticks(np.arange(1, 11, 1))
plt.xlabel("Number of Runs $(r)$", fontsize=15)
plt.ylabel("Percentage of Sequences", fontsize=15)
plt.grid(axis="y")
plt.legend(fontsize=15)
plt.savefig(f"combined_number_of_runs.jpg", format="jpg")
plt.close()

# Run Length for Combined Results
BINS = np.arange(1, 11)
THEORETICAL_LENGTH_OF_RUNS = {
    1: 3072,
    2: 1408,
    3: 640,
    4: 288,
    5: 128,
    6: 56,
    7: 24,
    8: 10,
    9: 4,
    10: 2
}
THEORETICAL_DISTRIBUTION = [(THEORETICAL_LENGTH_OF_RUNS[i] / sum(THEORETICAL_LENGTH_OF_RUNS.values())) * 100 for i in BINS]
ACTUAL_DISTRIBUTION = [(COMBINED_LENGTH_OF_RUNS[i] / sum(COMBINED_LENGTH_OF_RUNS.values())) * 100 for i in BINS]
plt.figure(figsize=(10, 5))
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
plt.xticks(np.arange(1, 11, 1))
plt.xlabel("Length of Runs $(m)$", fontsize=15)
plt.ylabel("Percentage of Runs", fontsize=15)
plt.grid(axis="y")
plt.legend(fontsize=15)
plt.savefig(f"combined_length_of_runs.jpg", format="jpg")
plt.close()