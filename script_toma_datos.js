



i = 0;
opened = false;
csv = [];
const webSocket = new WebSocket("ws://localhost:3000");


webSocket.onopen = function (e) {
    opened = true;        
}


AFRAME.registerComponent("log-hand-pose", {     
    //
    init: function () {
      this.isImmersive = false;
      this.xr = this.el.sceneEl.renderer.xr;
      this.el.addEventListener("hand-tracking-extras-ready", (e) => {
        this.joints = e.detail.data.joints;
      });

           
  
      this.el.sceneEl.addEventListener("enter-vr", async (e) => {
        console.log("enter-vr");
        webSocket.send(JSON.stringify({msg: "START"}));

        //console.log(this.el.components["hand-tracking-controls"]);
        this.session = await this.xr.getSession();
        let refSpaceType =
          this.el.sceneEl.systems.webxr.sessionReferenceSpaceType ||
          "local-floor";
        this.referenceSpace = await this.session.requestReferenceSpace(
          refSpaceType
        );
        this.isImmersive = true;
        
         
      });
  
      this.el.sceneEl.addEventListener("exit-vr", (e) => {
        console.log("exit-vr");
        this.isImmersive = false;
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
      if (this.joints && this.isImmersive) {
        /* 
        Con hand-tracking-extras 
        https://github.com/gftruj/aframe-hand-tracking-controls-extras
        */
  
        //console.log(this.joints.Wrist.getPosition());
  
        /* 
        Con WebXR
        */
        
        const frame = this.el.sceneEl.frame;
        let poses = new Float32Array(16*25);
        
        const mat4 = new THREE.Matrix4();

        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const rot = new THREE.Euler();

        const joints = [];
        
        if (this.session.inputSources[1].hand) {
            let inputSource = this.session.inputSources[1];
            let right_hand = this.session.inputSources[1].hand;
            
            const wrist = inputSource.hand.get("wrist");
            const wristPose = frame.getJointPose(wrist, this.referenceSpace);
            if(wristPose){
            //webSocket.send(JSON.stringify({msg: "HAND", payload: wristPose}));

            /****************** FUNNCION RÄPIDA  **********/
            frame.fillPoses(right_hand.values(), this.referenceSpace, poses);
            
            
            joint_aux =[]
            //console.log(poses)
            for (let i = 0; i < poses.length; i++){ //400
              //Rellenamos valores hasta que tengamos 16 (mat4)
              joint_aux.push(poses[i]);
              //console.log(joint_aux);
              //console.log(joint_aux.length);
              //console.log(i);

              if(joint_aux.length == 16){
                //console.log(joint_aux)
                
                //Convertimos el array a matriz4 y la descomponemos en posición, quaternion y escala
                  mat4.fromArray(joint_aux).decompose(pos, quat, scale);
                
                //Cñodigo para imprimir la matriz
                /*for (let i = 0; i < 4; i++) {
                  let fila = "";
                  for (let j = 0; j < 4; j++) {
                    fila += mat4.elements[i * 4 + j] + " ";
                  }
                  console.log(fila);
                }*/
                

                //A partir del quaternion obtenemos la rotacion
                rot.setFromQuaternion(quat);
                //Creamos un objeto joint que guarde posicion y rotacion para cada punto clave
                var joint = {pos, rot};
                //Lo añadimos al array joints
                //console.log(joint);
                joints.push(joint);
                
                joint_aux =[]
              }
              
            }
            //console.log(joints)
            webSocket.send(JSON.stringify({msg: "HAND", payload: joints}));

          }else{
            console.log("No se ha detectado mano");
          }
           


            /**************Código lento*****************/
            /*const wrist = inputSource.hand.get("wrist");
            const wristPose = frame.getJointPose(wrist, this.referenceSpace);

            if(wristPose){
            console.log(wrist.jointName, wristPose.transform.position);
            for (finger of orderedJoints){
                
                let previous = wristPose;
                for (joint of finger){
                  let art = inputSource.hand.get(joint);
                  if(art){
                    let pose = frame.getJointPose(art, this.referenceSpace);
                    console.log(art.jointName, pose.transform.position);
                    previous = pose;
                  }
                }
            }
          }else{
            console.log("No se ha detectado mano")
          }
            
    
            
            /**********PRUEBA CSV  ***************/
            /*var csv_data ={};
            csv_data.frame = i;
            csv_data.poses = wristPose;
            csv.push(csv_data);
            //console.log(csv);
            i++;

            if (i>500){
              //convert_to_csv(csv);
            }*/
            
          }
        }
        

        
        //
      }
    }
  );


  function convert_to_csv(csv){

    for(let row = 0; row < csv.length; row++){
      let keysAmount = Object.keys(csv[row]).length
      let keysCounter = 0
  
      // If this is the first row, generate the headings
      if(row === 0){
  
         // Loop each property of the object
         for(let key in csv[row]){
  
                             
             csv += key + (keysCounter+1 < keysAmount ? ',' : '\r\n' )
             keysCounter++
         }
      
      }/*else{
         for(let key in csv[row]){
             csv += csv[row][key] + (keysCounter+1 < keysAmount ? ',' : '\r\n' )
             keysCounter++
         }
      }*/
  
      keysCounter = 0
  }
  /*let link = document.createElement('a')
  link.id = 'download-csv'
  link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
  link.setAttribute('download', 'yourfiletextgoeshere.csv');
  document.body.appendChild(link)
  document.querySelector('#download-csv').click()*/
  }
  