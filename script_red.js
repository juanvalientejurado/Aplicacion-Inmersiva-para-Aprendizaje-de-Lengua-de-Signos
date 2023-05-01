const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');

//Clases
const clases = {
    vocala: 0,
    vocale: 1,
    vocali: 2,
    vocalo: 3,
    vocalu: 4
  };



// Leer el archivo JSON y convertirlo en objeto de JavaScript
const vocala = JSON.parse(fs.readFileSync('.\\data\\vocalA.json', 'utf-8'));
const vocale = JSON.parse(fs.readFileSync('.\\data\\vocalE.json', 'utf-8'));
const vocali = JSON.parse(fs.readFileSync('.\\data\\vocalI.json', 'utf-8'));
const vocalo = JSON.parse(fs.readFileSync('.\\data\\vocalO.json', 'utf-8'));
const vocalu = JSON.parse(fs.readFileSync('.\\data\\vocalU.json', 'utf-8'));

//Variables que alojan los datos de cada archivo
var datosA = []
var datosE =[]
var datosI =[]
var datosO=[]
var datosU=[]

for (let j = 0; j < 5; j++){
    //La funcion rellenar array crea un objeto con dos campos (frame: datos) y la clase a la que pertenece en funcion del archivo 
    datos = rellenarArray(j);
    switch (j){
        case 0: datosA = datos; break;
        case 1: datosE = datos; break;
        case 2: datosI = datos; break;
        case 3: datosO = datos; break;
        case 4: datosU = datos; break;
    }
}
var X_train, X_test, y_train, y_test;
//Concatenamos los datos (arrays de objetos )
const allData = datosA.concat(datosE, datosI, datosO, datosU);
//Esta funcion devuelve los tensores
var tensor_data = createDataTensor(allData);
var X_train = tensor_data.X_train;
var X_test = tensor_data.X_test;
var y_train = tensor_data.y_train;
var y_test = tensor_data.y_test;



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
        coordenadas =[]
        for(let j = 0; j< feature.length; j++){
            //Aqui es donde habría que meter la normalizacion para las posiciones
            //Array de 150
            coordenadas.push(feature[j].pos.x, feature[j].pos.y, feature[j].pos.z, 
                feature[j].rot._x, feature[j].rot._y, feature[j].rot._z);
                
        }
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

//Funcion auxiliar para aleatorizar
function aleatorizar(a,b){
    return Math.random() - 0.5;
}