import json
import matplotlib.pyplot as plt
import numpy as np
import os
import scipy.stats as stats

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

EXPECTED_NUMBER_OF_HEADS = stats.binom.pmf(np.arange(0, 11), 10, 0.5) * 100
EXPECTED_NUMBER_OF_RUNS = stats.binom.pmf(np.arange(1, 11) - 1, 9, 0.5) * 100
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
EXPECTED_LENGTH_OF_RUNS = [(THEORETICAL_LENGTH_OF_RUNS[i] / sum(THEORETICAL_LENGTH_OF_RUNS.values())) * 100 for i in np.arange(1, 11)]

FILES = [file for file in os.listdir(DIRECTORY)]
COMBINED_NUMBER_OF_HEADS = {i: 0 for i in range(11)}
COMBINED_NUMBER_OF_RUNS = {i: 0 for i in range(1, 11)}
COMBINED_LENGTH_OF_RUNS = {i: 0 for i in range(1, 11)}
combined_length = 0

for file in FILES:
    with open(f"{DIRECTORY}/{file}", "r") as f:
        data = json.load(f)

    SEQUENCES = data["sequences"]
    combined_length += len(SEQUENCES)
    for sequence in SEQUENCES:
        run_lengths = count_runs(sequence)
        for length in run_lengths:
            COMBINED_LENGTH_OF_RUNS[length] += 1

        heads = sequence.count("1")
        COMBINED_NUMBER_OF_HEADS[heads] += 1
        runs = 1
        last_bit = sequence[0]

        for bit in sequence[1:]:
            if bit != last_bit:
                runs += 1
            last_bit = bit

        COMBINED_NUMBER_OF_RUNS[runs] += 1

# Number of Heads for Combined Results
EXPECTED_NUMBER_OF_HEADS = stats.binom.pmf(np.arange(0, 11), 10, 0.5) * 100
EXPECTED_NUMBER_OF_RUNS = stats.binom.pmf(np.arange(1, 11) - 1, 9, 0.5) * 100
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
EXPECTED_LENGTH_OF_RUNS = [(THEORETICAL_LENGTH_OF_RUNS[i] / sum(THEORETICAL_LENGTH_OF_RUNS.values())) * 100 for i in np.arange(1, 11)]

OBSERVED_NUMBER_OF_HEADS = [
    (COMBINED_NUMBER_OF_HEADS[i] / combined_length) * 100 for i in range(11)
]
OBSERVED_NUMBER_OF_RUNS = [
    (COMBINED_NUMBER_OF_RUNS[i] / combined_length) * 100 for i in np.arange(1, 11)
]
OBSERVED_LENGTH_OF_RUNS = [(COMBINED_LENGTH_OF_RUNS[i] / sum(COMBINED_LENGTH_OF_RUNS.values())) * 100 for i in np.arange(1, 11)]

print(OBSERVED_LENGTH_OF_RUNS)

chi_square, p_value = stats.chisquare(OBSERVED_NUMBER_OF_HEADS, EXPECTED_NUMBER_OF_HEADS)
print(f"\u03C72(10, N={sum(COMBINED_NUMBER_OF_HEADS.values())}) = {chi_square}, p = {p_value}")

chi_square, p_value = stats.chisquare(OBSERVED_NUMBER_OF_RUNS, EXPECTED_NUMBER_OF_RUNS)
print(f"\u03C72(9, N={sum(COMBINED_NUMBER_OF_RUNS.values())}) = {chi_square}, p = {p_value}")

chi_square, p_value = stats.chisquare(OBSERVED_LENGTH_OF_RUNS, EXPECTED_LENGTH_OF_RUNS)
print(f"\u03C72(9, N={sum(COMBINED_LENGTH_OF_RUNS.values())}) = {chi_square}, p = {p_value}")

