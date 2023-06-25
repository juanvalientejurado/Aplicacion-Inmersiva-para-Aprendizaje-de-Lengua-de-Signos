var model; 
var accumulated = 0;
var target;
var color = "red"
var predictionArray=[];



i = 0;
//Componente mano
AFRAME.registerComponent("log-hand-pose", {     
    //
    init: async function () {
      this.isImmersive = false;
      this.xr = this.el.sceneEl.renderer.xr;
      this.el.addEventListener("hand-tracking-extras-ready", (e) => {
        this.joints = e.detail.data.joints;
      });

      model = await loadModel("models/modelo_posicion_ormuneca/model.json");
      
      target = 'a';
      
    
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
        webSocket.send(JSON.stringify({msg: "STOP"}));
      });
  },

 

  

  tick: function () {

   

    //Lo primero que se hace al empezar el metodo tick es poner la imagen
    var imagen = document.getElementById('imagen');
    switch(target){
      case 'a':
        imagen.setAttribute('src', 'imagenes/a.jpg');
        break;
      case 'e':
        imagen.setAttribute('src', 'imagenes/e.jpg');
        break;
      case 'i':
        imagen.setAttribute('src', 'imagenes/i.jpg');
        break;
      case 'o':
        imagen.setAttribute('src', 'imagenes/o.jpg');
        break;
      case 'u':
        imagen.setAttribute('src', 'imagenes/u.jpg');
        break;
      default:
        break;
    }

    const orderedJoints = [
      ["thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"],
      ["index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-phalanx-intermediate", "index-finger-phalanx-distal", "index-finger-tip"],
      ["middle-finger-metacarpal", "middle-finger-phalanx-proximal", "middle-finger-phalanx-intermediate", "middle-finger-phalanx-distal", "middle-finger-tip"],
      ["ring-finger-metacarpal", "ring-finger-phalanx-proximal", "ring-finger-phalanx-intermediate", "ring-finger-phalanx-distal", "ring-finger-tip"],
      ["pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-phalanx-intermediate", "pinky-finger-phalanx-distal", "pinky-finger-tip"]
    ];

    //Si estamos en inmersivo y tenemos articulaciones 
    if (this.joints && this.isImmersive) {
      i++;
      //Capturamos el frame y creamos el contenedor de las poses de la mano
      const frame = this.el.sceneEl.frame;
      let poses = new Float32Array(16*25);
      

      const joints = [];
      let inputSource;
      let right_hand;
      
      inputSource = this.session.inputSources[0];
      right_hand = this.session.inputSources[0].hand;
      
      
      
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
        var orientacion_mano = [coordenadas_orientacion[0], coordenadas_orientacion[1], coordenadas_orientacion[2]]
        var coordenadas = posicion_normalizada.concat(orientacion_mano);
        //console.log(coordenadas);
        var input_tensor = tf.tensor(coordenadas).reshape([1,78]);
        //console.log(input_tensor.shape)
        const prediction = model.predict(input_tensor);
        //console.log(prediction.arraySync());
        const class_pred = prediction.argMax(axis=1).arraySync();
        console.log(class_pred[0]);
       
        var e1 = document.querySelector("#esfera1");
        var e2 = document.querySelector("#esfera2");
        var e3 = document.querySelector("#esfera3");


        
        switch(class_pred[0]){
            case 0:
                if(target == 'a'){
                  accumulated++;
                  e2.setAttribute("material", "color", "white");
                  e3.setAttribute("material", "color", "white");
                }
                if(accumulated > 100){
                  e2.setAttribute("material", "color", "yellow");
                }else{
                  e1.setAttribute("material", "color", "red");
                }
                if(target =='a' && accumulated > 500){
                  e3.setAttribute("material", "color", "green");
                  target = 'e';
                  accumulated=0;
                }
                break;
            case 1: 
                if(target == 'e'){
                  accumulated++;
                  e2.setAttribute("material", "color", "white");
                  e3.setAttribute("material", "color", "white");
                }
                if(accumulated > 100){
                  e2.setAttribute("material", "color", "yellow");
                }else{
                  e1.setAttribute("material", "color", "red");
                }
                if(target == 'e' && accumulated == 500){
                  e3.setAttribute("material", "color", "green");
                  target = 'i';
                  accumulated=0;
                }
                break;
            case 2:
                if(target == 'i'){
                  accumulated++;
                  e2.setAttribute("material", "color", "white");
                  e3.setAttribute("material", "color", "white");
                }
                if(accumulated > 100){
                  e2.setAttribute("material", "color", "yellow");
                }else{
                  e1.setAttribute("material", "color", "red");
                }               
                if(target == 'i' && accumulated == 500){
                  e3.setAttribute("material", "color", "green");
                  target = 'o';
                  accumulated = 0;
                }
                
                break;
            case 3:
                if(target == 'o'){
                  accumulated++;
                  e2.setAttribute("material", "color", "white");
                  e3.setAttribute("material", "color", "white");
                }
                if(accumulated > 100){
                  e2.setAttribute("material", "color", "yellow");
                }else{
                  e1.setAttribute("material", "color", "red");
                } 
                if(target == 'o' && accumulated == 500){
                  e3.setAttribute("material", "color", "green");
                  target = 'u';
                  accumulated = 0;
                }
                break;
            case 4:
                if(target == 'u'){
                  e2.setAttribute("material", "color", "white");
                  e3.setAttribute("material", "color", "white");
                  accumulated++;
                }
                if(accumulated > 100){
                  e2.setAttribute("material", "color", "yellow");
                }else{
                  e1.setAttribute("material", "color", "red");
                }                 
                if(target == 'u' && accumulated == 500){
                  e3.setAttribute("material", "color", "green");
                  target='a';
                  accumulated = 0;
                }
                break;
            case 5: 
                accumulated = 0;
                e1.setAttribute("material", "color", "white");
                e2.setAttribute("material", "color", "white");
                e3.setAttribute("material", "color", "white");
  
            default:
              e1.setAttribute("material", "color", "white");
              e2.setAttribute("material", "color", "white");
              e3.setAttribute("material", "color", "white");


        }
        //console.log(accumulated)
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
