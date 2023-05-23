var model; 


//Componente mano
AFRAME.registerComponent("log-hand-pose", {     
    //
    init: async function () {
      this.isImmersive = false;
      this.xr = this.el.sceneEl.renderer.xr;
      this.el.addEventListener("hand-tracking-extras-ready", (e) => {
        this.joints = e.detail.data.joints;
      });

      model = await loadModel("models/modelo_sin_orientacion/model.json");
      

      
    
  //Si se pulsa el boton de entrar en VR
      this.el.sceneEl.addEventListener("enter-vr", async (e) => {
        console.log("enter-vr");
        
        this.session = await this.xr.getSession();
        let refSpaceType =
          this.el.sceneEl.systems.webxr.sessionReferenceSpaceType ||
          "local-floor";
        this.referenceSpace = await this.session.requestReferenceSpace(
          refSpaceType
        );
        this.isImmersive = true;  
      });
  
      //Si se pulsa el boton de salir de VR
      this.el.sceneEl.addEventListener("exit-vr", (e) => {
        console.log("exit-vr");
        this.isImmersive = false;
      });
  },

  

  tick: function () {
      
    const orderedJoints = [
      ["thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"],
      ["index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-phalanx-intermediate", "index-finger-phalanx-distal", "index-finger-tip"],
      ["middle-finger-metacarpal", "middle-finger-phalanx-proximal", "middle-finger-phalanx-intermediate", "middle-finger-phalanx-distal", "middle-finger-tip"],
      ["ring-finger-metacarpal", "ring-finger-phalanx-proximal", "ring-finger-phalanx-intermediate", "ring-finger-phalanx-distal", "ring-finger-tip"],
      ["pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-phalanx-intermediate", "pinky-finger-phalanx-distal", "pinky-finger-tip"]
    ];

    //Si estamos en inmersivo y tenemos articulaciones 
    if (this.joints && this.isImmersive) {

      //Capturamos el frame y creamos el contenedor de las poses de la mano
      const frame = this.el.sceneEl.frame;
      let poses = new Float32Array(16*25);
      

      const joints = [];
      let inputSource;
      let right_hand;
      //Si se ha detectado la mano derecha
      if(this.session.inputSources.length == 0){ return; }
      if(this.session.inputSources.length ==1){
        inputSource = this.session.inputSources[0];
        right_hand = this.session.inputSources[0].hand;
      }else{
        inputSource = this.session.inputSources[1];
        right_hand = this.session.inputSources[1].hand;
      }
      
      
      if (right_hand) {
          
          //Cogemos la muñeca
          const wrist = inputSource.hand.get("wrist");
          const wristPose = frame.getJointPose(wrist, this.referenceSpace);

          //Si se ha detectado la muñeca
          if(wristPose){
            //console.log("Mano");

            //Rellenamos el array de poses que contiene la matriz4 que especifica las transformaciones en el espacio 3D
            frame.fillPoses(right_hand.values(), this.referenceSpace, poses);
            
            //Recorremos el array y cada 16 creamos variables con las que convertiremos
            for (let i = 0; i < poses.length; i += 16) {
              const jointPos = new THREE.Vector3().fromArray(poses, i + 12);
              const jointQuat = new THREE.Quaternion().fromArray(poses, i + 0);
              const jointRot = new THREE.Euler().setFromQuaternion(jointQuat);
          
              //Creamos un objeto joint que guarde posicion y rotacion para cada punto clave
              var joint = { pos: jointPos, rot: jointRot };
            
              //Lo añadimos al array joints
              joints.push(joint);
            }
          
        //El objeto joint hay que transformarlo en un tensor de 1x150
        coordenadas_posicion = [];
        coordenadas_orientacion = [];
        for(let j = 0; j< joints.length; j++){
            //Aqui es donde habría que meter la normalizacion para las posiciones
            //Separamos para poder normalizar la posicion
            coordenadas_posicion.push(joints[j].pos.x, joints[j].pos.y, joints[j].pos.z);
            coordenadas_orientacion.push(joints[j].rot._x, joints[j].rot._y, joints[j].rot._z);            

        }

        var posicion_normalizada= normalize_positions(coordenadas_posicion);

        //var characteristic_vector = get_characteristic_vector(coordenadas_posicion);
        var orientacion_mano = [coordenadas_orientacion[33], coordenadas_orientacion[34], coordenadas_orientacion[35]]
        var coordenadas = posicion_normalizada.concat(orientacion_mano);
        //console.log(coordenadas);
        var input_tensor = tf.tensor(posicion_normalizada).reshape([1,75]);
        //console.log(input_tensor.shape)
        const prediction = model.predict(input_tensor);
        //console.log(prediction.arraySync());
        const class_pred = prediction.argMax(axis=1).arraySync();
        console.log(class_pred[0]);
        var cube = document.querySelector("#cubo");
        switch(class_pred[0]){
            case 0:
                cube.setAttribute("material", "color", "red");
                break;
            case 1: 
                cube.setAttribute("material", "color", "blue");
                break;
            case 2:
                cube.setAttribute("material", "color", "yellow");
                break;
            case 3:
                cube.setAttribute("material", "color", "green");
                break;
            case 4:
                cube.setAttribute("material", "color", "black");
                break;
            default:
                cube.setAttribute("material", "color", "white");

        }
        
        }else{
          console.log("No se ha detectado mano");
        }

      }
    }
  }
}
);

//Funcion que carga el modelo
async function loadModel(path){
    const model = await tf.loadLayersModel(path);
    model.summary();
    console.log("Classification Model Loaded Succesfully");
    return model;
}

//Funcion para normaliizar las posiciones
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



//Funcion que normaliza como en el paper
function get_characteristic_vector(coordenadas_posicion){
  var nudillo_indice = {
      x: coordenadas_posicion[18],
      y: coordenadas_posicion[19],
      z: coordenadas_posicion[20]
  }
  var nudillo_corazon = {
      x: coordenadas_posicion[33],
      y: coordenadas_posicion[34],
      z: coordenadas_posicion[35]
  }
  var nudillo_menique = {
      x: coordenadas_posicion[63],
      y: coordenadas_posicion[64],
      z: coordenadas_posicion[65]
  }
  //Media de los nudillos del indice, corazon y meñique
  var punto_central = getCenterPoint_paper(nudillo_indice, nudillo_corazon, nudillo_menique);

  var muneca={
      x: coordenadas_posicion[0],
      y: coordenadas_posicion[1],
      z: coordenadas_posicion[2]
  }
  //El angulo del vector es el vector definido entre dos vectores: ver funcion 
  var punto_final = getVectorAngle(nudillo_corazon, muneca, nudillo_menique, nudillo_indice);

  var normalized_positions ={
      x: (punto_central.x - punto_final.x),
      y: (punto_central.y - punto_final.y),
      z: (punto_central.z - punto_final.z)
  }

  vector_característico = [normalized_positions.x, normalized_positions.y, normalized_positions.z];

  return vector_característico;
  
}


//Calculo del centro de la mano
function getCenterPoint_paper(nudillo_indice, nudillo_corazon, nudillo_menique){
  var center_x = (nudillo_indice.x + nudillo_corazon.x + nudillo_menique.x)/3;
  var center_y = (nudillo_indice.y + nudillo_corazon.y + nudillo_menique.y)/3;
  var center_z = (nudillo_indice.z + nudillo_corazon.z + nudillo_menique.z)/3;

  return {
      x: center_x,
      y: center_y,
      z: center_z
  }
}

function getVectorAngle(nudillo_corazon, muneca, nudillo_menique, nudillo_indice){
    var vector1 = {
        x: (nudillo_corazon.x - muneca.x),
        y: (nudillo_corazon.y - muneca.y),
        z: (nudillo_corazon.z - muneca.z)
    }

    var vector2 = {
        x: (nudillo_menique.x - nudillo_indice.x),
        y: (nudillo_menique.y - nudillo_indice.y),
        z: (nudillo_menique.z - nudillo_indice.z)
    }

    var vector_resultante ={
        x: (vector1.x + vector2.x),
        y: (vector1.y + vector2.y),
        z: (vector1.z + vector2.z)
    }

    return vector_resultante;
}