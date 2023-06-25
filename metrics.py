import json
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, roc_auc_score
from sklearn.preprocessing import label_binarize
from itertools import cycle

# Cargar el archivo JSON con las predicciones
with open('models\modelo_con_none\prediccionesA.json', 'r') as file:
    predictionsA = json.load(file)

with open('models\modelo_con_none\prediccionesE.json', 'r') as file:
    predictionsE = json.load(file)

with open('models\modelo_con_none\prediccionesI.json', 'r') as file:
    predictionsI = json.load(file)

with open('models\modelo_con_none\prediccionesO.json', 'r') as file:
    predictionsO = json.load(file)

with open('models\modelo_con_none\prediccionesU.json', 'r') as file:
    predictionsU = json.load(file)

with open('models\modelo_con_none\prediccionesnone.json', 'r') as file:
    predictionsnone = json.load(file)

# Crear una lista de ceros del mismo tamaño que la lista de predicciones
targetsA = [0] * len(predictionsA)
targetsE = [1] * len(predictionsE)
targetsI = [2] * len(predictionsI)
targetsO = [3] * len(predictionsO)
targetsU = [4] * len(predictionsU)
targetsNone = [5] * len(predictionsnone)


y_test = np.concatenate([targetsA, targetsE, targetsI, targetsO, targetsU, targetsNone])
y_pred = np.concatenate([predictionsA, predictionsE, predictionsI, predictionsO, predictionsU, predictionsnone])





