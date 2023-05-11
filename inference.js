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

      model = await loadModel("models/model.json");
      var handElement = document.querySelector("#rightHand");
      handElement.setAttribute("color", "red");

      
    
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
      
      //Si se ha detectado la mano derecha
      if (this.session.inputSources[1].hand) {
          let inputSource = this.session.inputSources[1];
          let right_hand = this.session.inputSources[1].hand;
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
        coordenadas =[];
        for(let j = 0; j< joints.length; j++){
            //Aqui es donde habría que meter la normalizacion para las posiciones
            //Array de 150
            coordenadas.push(joints[j].pos.x, joints[j].pos.y, joints[j].pos.z, 
                joints[j].rot._x, joints[j].rot._y, joints[j].rot._z);       
        }
        //console.log(coordenadas);
        var input_tensor = tf.tensor(coordenadas).reshape([1,150]);
        //console.log(input_tensor.shape)
        const prediction = model.predict(input_tensor);
        //console.log(prediction.arraySync());
        const class_pred = prediction.argMax(axis=1).arraySync();
        console.log(class_pred[0]);
        var handElement = document.querySelector("#rightHand");
        switch(class_pred[0]){
            case 0:
                handElement.setAttribute("color", "red");
                break;
            case 1: 
                handElement.setAttribute("color", "green");
                break;
            case 2:
                handElement.setAttribute("color", "yellow");
                break;
            case 3:
                handElement.setAttribute("color", "blue");
                break;
            case 4:
                handElement.setAttribute("color", "black");
                break;
            default:
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