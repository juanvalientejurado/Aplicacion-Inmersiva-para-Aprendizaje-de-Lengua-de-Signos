//Creamos instancia websocket
const webSocket = new WebSocket("ws://localhost:3000");

//Cuando se abra decimos que la conexion está establecida
webSocket.onopen = function (e) {
    console.log("Conexion establecida");   
}

i = 0;
//Componente mano
AFRAME.registerComponent("log-hand-pose", {     
    //
    init: function () {
      this.isImmersive = false;
      this.xr = this.el.sceneEl.renderer.xr;
      this.el.addEventListener("hand-tracking-extras-ready", (e) => {
        this.joints = e.detail.data.joints;
      });
    
  //Si se pulsa el boton de entrar en VR
      this.el.sceneEl.addEventListener("enter-vr", async (e) => {
        console.log("enter-vr");
        //Mandamos el mensaje de START
        webSocket.send(JSON.stringify({msg: "START"}));

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
        //Mandamos el mensaje de STOP
        webSocket.send(JSON.stringify({msg: "STOP"}));
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
        console.log(i)
        i++
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
            
            //console.log(joints[22].pos.x)
            //Enviamos el objeto por websocket
            if (i>1000 && i< 3000){
              webSocket.send(JSON.stringify({msg: "RECORDING", payload: joints}));
            }else if(i > 3000){
              webSocket.send(JSON.stringify({msg: "STOP RECORDING"}));
            }

          }else{
            console.log("No se ha detectado mano");
          }

        }
      }
    }
  }
);

  