// función para cargar los datos de un archivo JSON
async function cargarDatosJSON(url) {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    return datos;
  }
  
  // función para crear las entidades A-Frame para cada articulación
  function crearEntidadesArticulacion(mano, marco) {
    // obtener los datos de posición y orientación de cada articulación en el marco especificado
    
    const datosArticulacion = mano[marco];
    console.log(datosArticulacion);
  
    // crear una entidad A-Frame para cada articulación
    for (let i = 0; i < datosArticulacion.length; i++) {
      const datos = datosArticulacion[i];
      console.log(datos.pos)
  
      // crear la entidad A-Frame
      const entidad = document.createElement('a-entity');
        
      // configurar la posición de la entidad
      entidad.setAttribute('position', `${datos.pos.x} ${datos.pos.y} ${datos.pos.z}`);
  
      // agregar una geometría a la entidad
      entidad.setAttribute('geometry', {
        primitive: 'sphere',
        radius: 0.01
      });
  
      // agregar la entidad al escenario
      document.querySelector('a-scene').appendChild(entidad);
    }
  }
  
  // función para inicializar la escena A-Frame y mostrar la mano en un marco de tiempo específico
  async function mostrarManoEnMarco(url, marco) {
    // cargar los datos del archivo JSON
    
    /*const content = fs.readFileSync(url, 'utf8');
    const data = JSON.parse(content);
    console.log(data);*/
    const datos = await cargarDatosJSON(url);
    
    
  
    // crear las entidades para cada articulación en el marco especificado
    crearEntidadesArticulacion(datos, marco);
    
    // configurar la cámara de la escena
    const camara = document.querySelector('[camera]');
    camara.setAttribute('position', '0 0 0');
    camara.setAttribute('look-controls', '');
    camara.setAttribute('wasd-controls', '');
    
    // configurar la luz de la escena
    const luz = document.createElement('a-entity');
    luz.setAttribute('light', {
      type: 'point',
      intensity: 1,
      color: '#fff',
      distance: 50
    });
    luz.setAttribute('position', '0 0 0');
    document.querySelector('a-scene').appendChild(luz);
  }
  