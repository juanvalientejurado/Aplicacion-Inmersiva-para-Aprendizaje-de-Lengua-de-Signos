const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');

//Clases
const clases = {
    vocala: 0,
    vocale: 1,
    vocali: 2,
    vocalo: 3,
    vocalu: 4,
    none: 5
  };

//Modelo(
const INPUT_SHAPE = 150; //Tamaño del frame (n_coordenadas)
const NUM_CLASSES = 6;



// Leer el archivo JSON y convertirlo en objeto de JavaScript
const vocala = JSON.parse(fs.readFileSync('.\\data\\vocalA.json', 'utf-8'));
const vocale = JSON.parse(fs.readFileSync('.\\data\\vocalE.json', 'utf-8'));
const vocali = JSON.parse(fs.readFileSync('.\\data\\vocalI.json', 'utf-8'));
const vocalo = JSON.parse(fs.readFileSync('.\\data\\vocalO.json', 'utf-8'));
const vocalu = JSON.parse(fs.readFileSync('.\\data\\vocalU.json', 'utf-8'));
const none = JSON.parse(fs.readFileSync('.\\data\\sinvocal.json', 'utf-8'));

//Variables que alojan los datos de cada archivo
var datosA = []
var datosE =[]
var datosI =[]
var datosO=[]
var datosU=[]
var datosNone=[]

for (let j = 0; j < 6; j++){
    //La funcion rellenar array crea un objeto con dos campos (frame: datos) y la clase a la que pertenece en funcion del archivo 
    datos = rellenarArray(j);
    switch (j){
        case 0: datosA = datos; break;
        case 1: datosE = datos; break;
        case 2: datosI = datos; break;
        case 3: datosO = datos; break;
        case 4: datosU = datos; break;
        case 5: datosNone = datos; break;
    }
}
var X_train, X_test, y_train, y_test;
//Concatenamos los datos (arrays de objetos )
const allData = datosA.concat(datosE, datosI, datosO, datosU, datosNone);
//Esta funcion devuelve los tensores
var tensor_data = createDataTensor(allData);
var X_train = tensor_data.X_train;
var X_test = tensor_data.X_test;
var y_train= tensor_data.y_train;
var y_test = tensor_data.y_test;

async function app(){
const model = createModel();
//var y_train = tf.expandDims(y_train_plain, 1);
//console.log(y_train.shape);

//const y_train_onehot = tf.oneHot(tf.tensor1d(y_train_plain.arraySync(), 'int32'), NUM_CLASSES);
await trainModel(model, X_train, y_train);
console.log("Model trained");

const predictions = model.predict(X_test);

const y_test_pred = predictions.argMax(axis=1).arraySync();
const confusionMatrix = tf.math.confusionMatrix(y_test, y_test_pred, NUM_CLASSES);
await model.save('file://./models/modelo_posicion_ormuneca');
console.log(confusionMatrix.arraySync());
}

app();

//Rellena el array asignando clases en funcion del archivo del que se lee
function rellenarArray(index){
    var file_length;
    var vocal;
    var datos=[];
    switch (index){
        case 0: 
            file_length = vocala.length; 
            vocal = vocala;
            break;
        case 1: 
            file_length = vocale.length; 
            vocal = vocale;
            break;
        case 2: 
            file_length = vocali.length; 
            vocal = vocali;
            break;
        case 3: 
            file_length = vocalo.length; 
            vocal = vocalo;
            break;
        case 4: 
            file_length = vocalu.length; 
            vocal = vocalu;
            break;
        case 5: 
            file_length = none.length; 
            vocal = none;
            break;

        default:       
    }

    for (let i = 0; i < file_length; i++) {
        const vocalobj ={
            frame: vocal[i], 
            clase: index
        };
        datos.push(vocalobj)
    }

return datos;
}
//Crea los tensores
function createDataTensor(data){
    //Aleatoriza
    data.sort(aleatorizar);
    const numTrain = Math.floor(data.length * 0.8);
    var features = [];
    var labels =[];
    
    for(let i = 0; i<data.length; i++){
        feature = data[i].frame;
        clase = data[i].clase;
        
        coordenadas_posicion =[]
        coordenadas_orientacion =[]
        for(let j = 0; j< feature.length; j++){
            
            //Array de 75. Los separamos para poder normalizarlos
            coordenadas_posicion.push(feature[j].pos.x, feature[j].pos.y, feature[j].pos.z) 
            //Array de 75
            coordenadas_orientacion.push(feature[j].rot._x, feature[j].rot._y, feature[j].rot._z);
                
        }
        //Normalizamos las posiciones
        var posicion_normalizada = normalize_positions(coordenadas_posicion);

        //var characteristic_vector = get_characteristic_vector(coordenadas_posicion);
        //Una vez normalizados los comparamos
        var orientacion_mano = [coordenadas_orientacion[0], coordenadas_orientacion[1], coordenadas_orientacion[2]]
        var coordenadas = posicion_normalizada.concat(orientacion_mano);
        //Array de nframes filas por 150 columnas
        features.push(coordenadas);
        //Etiquetas
        labels.push(clase)
    }
    //Division en train y test
    var train_input_data = features.slice(0, numTrain);
    var train_output_data = labels.slice(0, numTrain); 
    var test_input_data = features.slice(numTrain);
    var test_output_data = labels.slice(numTrain);

    //Tensores
    const train_input_tensor = tf.tensor(train_input_data);//[ntrain x 150]
    const train_output_tensor = tf.tensor(train_output_data);
    const test_input_tensor = tf.tensor(test_input_data);
    const test_output_tensor = tf.tensor(test_output_data);  

    return {
        X_train: train_input_tensor, 
        y_train: train_output_tensor, 
        X_test: test_input_tensor, 
        y_test: test_output_tensor
    };
}

//Funcion para normalizar las posiciones
function normalize_positions(coordenadas_posicion){
    //Normalizaremos con respecto al centro de la mano y el tamaño de la manos
    //El centro es el punto central entre un triángulo en 3D de la muñeca y la punta de los dedos indice y meñique
    var wrist_x = coordenadas_posicion[0];
    var wrist_y = coordenadas_posicion[1];
    var wrist_z = coordenadas_posicion[2];
    var indice_x = coordenadas_posicion[18];
    var indice_y = coordenadas_posicion[19];
    var indice_z = coordenadas_posicion[20];
    var menique_x = coordenadas_posicion[72];
    var menique_y = coordenadas_posicion[73];
    var menique_z = coordenadas_posicion[74];

    const hand_center = getCenterPoint(wrist_x, wrist_y, wrist_z, indice_x, indice_y, indice_z,
        menique_x, menique_y, menique_z);
    
    //Calculamos el tamaño de la mano
    const hand_size = getHandSize(coordenadas_posicion, hand_center);

    //Los puntos se normalizan como =  (punto - centro)/tamaño
    puntos_normalizados =[];//Este tiene 25 objetos
    for (let i = 0; i < 25; i++){
        var index = i*3;
        var punto={
            x: coordenadas_posicion[index],
            y: coordenadas_posicion[index+1],
            z: coordenadas_posicion[index+2]
        }
        puntos_normalizados.push(normalizePoints(punto, hand_center, hand_size));
    }

    coordenadas_posicion_normalizadas = [];
    for(let i=0 ; i<puntos_normalizados.length; i++){
        coordenadas_posicion_normalizadas.push(puntos_normalizados[i].x, puntos_normalizados[i].y,
            puntos_normalizados[i].z);
    }
    
    return coordenadas_posicion_normalizadas;
}

//Calculo del centro de la mano
function getCenterPoint(wrist_x, wrist_y, wrist_z, indice_x, indice_y, indice_z, menique_x, menique_y, menique_z){
    var center_x = (wrist_x + indice_x + menique_x)/3;
    var center_y = (wrist_y + indice_y + menique_y)/3;
    var center_z = (wrist_z + indice_z + menique_z)/3;

    return {
        x: center_x,
        y: center_y,
        z: center_z
    }
}

//Calcula el tamaño de la mano
function getHandSize(coordenadas_posicion, hand_center){
    //El tamaño de la mano es el maximo de la distancia entre el centro de la mano  y el punto mas alejado
    //Distancia entre el centro de la mano y el centro de los dedos
    var punta_dedo_corazon ={
        x: coordenadas_posicion[42], //14*3
        y: coordenadas_posicion[43], 
        z: coordenadas_posicion[44],
    }
    var fingered_size = calculateDistance(punta_dedo_corazon, hand_center);
    var distancias =[]
    for (let i = 0; i < 25; i++){
        var index = i*3;
        var punto1={
            x: coordenadas_posicion[index],
            y: coordenadas_posicion[index+1],
            z: coordenadas_posicion[index+2]
        }
        distancias.push(calculateDistance(punto1, hand_center));
    }
    var distances_size = Math.max(...distancias);

    const hand_size = Math.max(fingered_size, distances_size);

    return hand_size;
}

//Funcion auxiliar que calcula la distancia de un punto a otro
function calculateDistance(punto1, punto2){
        const distanciaX = Math.abs(punto2.x - punto1.x);
        const distanciaY = Math.abs(punto2.y - punto1.y);
        const distanciaZ = Math.abs(punto2.z - punto1.z);
      
        const distancia = Math.sqrt(distanciaX ** 2 + distanciaY ** 2 + distanciaZ ** 2);
        return distancia;
}

//Funcion que dado un punto, centro y distancia lo normlaiza
function normalizePoints(punto, hand_center, hand_size){
    return {
        x: (punto.x - hand_center.x) / hand_size,
        y: (punto.y - hand_center.y) / hand_size,
        z: (punto.z - hand_center.z) / hand_size
    }
}

//Creacion del modelo
function createModel(){
    const model = tf.sequential();
    model.add(tf.layers.dense({inputShape: [78], units: 64, activation: 'relu'}));   
    model.add(tf.layers.dense({units: 32, activation: 'relu'}));
    model.add(tf.layers.dense({units: NUM_CLASSES, activation: 'softmax'}));
      
    model.summary();
    return model;
}

//Entrenamiento del modelo
async function trainModel(model, X_train, y_train){
    model.compile({
        optimizer: 'adam',
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
    });

    const params = {
        shuffle: true,
        validationSplit: 0.2,
        batchSize: 16,
        epochs: 20,
        callbacks: [new tf.CustomCallback({ onEpochEnd: logProgress })       
      ]
    };

    const results = await model.fit(X_train, y_train, params);
    console.log("Average error loss: " + Math.sqrt(results.history.loss[results.history.loss.length - 1]));//Error cuadrático medio
    console.log("Average validation error loss: " + Math.sqrt(results.history.val_loss[results.history.val_loss.length - 1]));
}

//Funcion auxiliar para aleatorizar
function aleatorizar(a,b){
    return Math.random() - 0.5;
}

//Funcion auxiliar loss logaritmico
function logProgress(epoch, logs) {
    console.log(`Data for epoch ${epoch}, ${Math.sqrt(logs.loss)}`);
}