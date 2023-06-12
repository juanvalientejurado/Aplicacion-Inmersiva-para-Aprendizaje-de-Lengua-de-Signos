import json
import pandas as pd

# Cargar el archivo JSON con las predicciones
with open('prediccionesU.json', 'r') as file:
    predictions = json.load(file)

# Crear una lista de ceros del mismo tamaño que la lista de predicciones
targets = [0] * len(predictions)

# Añadir la columna de targets al array de predicciones
df = pd.DataFrame({'Prediction': predictions, 'Target': targets})

# Imprimir el dataframe resultante
print(df)

