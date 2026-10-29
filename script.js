// ===== Referencias a los elementos del HTML =====
const formulario = document.getElementById('formulario');
const inputId = document.getElementById('id');
const inputNombre = document.getElementById('nombre');
const inputCorreo = document.getElementById('correo');
const inputCiudad = document.getElementById('ciudad');
const botonEnviar = document.getElementById('botonEnviar');
const botonCancelar = document.getElementById('botonCancelar');
const tituloFormulario = document.getElementById('tituloFormulario');
const buscador = document.getElementById('buscador');
const cuerpoTabla = document.getElementById('cuerpoTabla');
const mensaje = document.getElementById('mensaje');
const resumenCiudades = document.getElementById('resumenCiudades');

const URL_API = 'https://jsonplaceholder.typicode.com/users';

// Array con todos los usuarios (objetos con id, nombre, correo y ciudad)
let usuarios = [];

// Guarda el id del usuario que se está editando. Si es null, se está agregando uno nuevo.
let idEditando = null;

// ===== Mensajes de estado =====
// El tipo puede ser "exito", "error" o "info" y cambia el color del texto
const mostrarMensaje = (texto, tipo) => {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
};

// ===== Cargar usuarios desde la API =====
const cargarUsuarios = async () => {
  mostrarMensaje('Cargando...', 'info');
  try {
    const res = await fetch(URL_API);
    // fetch no da error si la respuesta es mala (por ejemplo 404), por eso se revisa res.ok
    if (!res.ok) {
      throw new Error('Respuesta incorrecta del servidor');
    }
    const datos = await res.json(); // convierte la respuesta a un array de objetos

    // map: de cada usuario de la API nos quedamos solo con los 4 campos que usamos.
    // La ciudad viene dentro de address, por eso se usa destructuring anidado.
    usuarios = datos.map(({ id, name, email, address: { city } }) => ({
      id: id,
      nombre: name,
      correo: email,
      ciudad: city,
    }));

    actualizarVista();
    mostrarMensaje('Usuarios cargados correctamente', 'exito');
  } catch (error) {
    mostrarMensaje('No se pudieron cargar los usuarios. Revisa tu conexión e intenta de nuevo.', 'error');
  }
};

// ===== Dibujar la tabla =====
// Recibe la lista que se quiere mostrar (completa o filtrada por el buscador)
const dibujarTabla = (lista) => {
  cuerpoTabla.innerHTML = ''; // se borra lo anterior antes de dibujar de nuevo

  if (lista.length === 0) {
    const fila = document.createElement('tr');
    fila.innerHTML = '<td colspan="5">No hay usuarios para mostrar</td>';
    cuerpoTabla.appendChild(fila);
    return;
  }

  lista.forEach((usuario) => {
    const { id, nombre, correo, ciudad } = usuario; // destructuring del usuario
    const fila = document.createElement('tr');

    // Template string para armar el contenido de la fila.
    // data-id guarda el id del usuario para saber cuál botón se pulsó.
    fila.innerHTML = `
      <td>${id}</td>
      <td>${nombre}</td>
      <td>${correo}</td>
      <td>${ciudad}</td>
      <td>
        <button class="editar" data-id="${id}">Editar</button>
        <button class="eliminar" data-id="${id}">Eliminar</button>
      </td>
    `;
    cuerpoTabla.appendChild(fila);
  });
};

// ===== Resumen de usuarios por ciudad (usa un bucle for) =====
const contarPorCiudad = () => {
  const conteo = {};
  for (let i = 0; i < usuarios.length; i++) {
    const ciudad = usuarios[i].ciudad;
    // Si la ciudad ya está en el objeto se suma 1, si no, empieza en 1
    conteo[ciudad] = (conteo[ciudad] || 0) + 1;
  }

  const partes = [];
  for (const ciudad in conteo) {
    partes.push(`${ciudad}: ${conteo[ciudad]}`);
  }
  resumenCiudades.textContent = `Usuarios por ciudad → ${partes.join(' | ')}`;
};

// ===== Filtro del buscador =====
// filter crea un array nuevo con los que coinciden, el array "usuarios" no se modifica
const obtenerFiltrados = () => {
  const texto = buscador.value.trim().toLowerCase();
  return usuarios.filter(({ nombre }) => nombre.toLowerCase().includes(texto));
};

// Se llama cada vez que cambia la lista: imprime en consola, redibuja y actualiza el resumen
const actualizarVista = () => {
  console.log(JSON.stringify(usuarios, null, 2));
  dibujarTabla(obtenerFiltrados());
  contarPorCiudad();
};

// ===== Validación del formulario =====
// Devuelve un código que describe el resultado, y luego un switch elige el mensaje
const validarFormulario = (id, nombre, correo, ciudad) => {
  if (id === '' || nombre === '' || correo === '' || ciudad === '') {
    return 'vacio';
  }
  if (isNaN(id)) {
    return 'idNoNumero';
  }
  if (!correo.includes('@')) {
    return 'correoInvalido';
  }
  // Si se está editando, el id no se revisa porque no se puede cambiar
  if (idEditando === null && usuarios.some((u) => u.id === Number(id))) {
    return 'idRepetido';
  }
  return 'ok';
};

const obtenerTextoError = (resultado, id) => {
  switch (resultado) {
    case 'vacio':
      return 'Todos los campos son obligatorios';
    case 'idNoNumero':
      return 'El id debe ser un número';
    case 'correoInvalido':
      return 'El correo debe contener @';
    case 'idRepetido':
      return `Ya existe un usuario con el id ${id}`;
    default:
      return '';
  }
};

// ===== Volver el formulario al modo "agregar" =====
const reiniciarFormulario = () => {
  formulario.reset();
  idEditando = null;
  inputId.disabled = false;
  botonEnviar.textContent = 'Agregar';
  tituloFormulario.textContent = 'Registrar usuario';
  botonCancelar.classList.add('oculto');
};

// ===== Evento submit del formulario: agregar o guardar cambios =====
formulario.addEventListener('submit', (event) => {
  event.preventDefault(); // evita que la página se recargue

  // trim quita los espacios del principio y del final
  const id = inputId.value.trim();
  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim();
  const ciudad = inputCiudad.value.trim();

  // Al editar el input del id está bloqueado, por eso se toma el id guardado
  const idFinal = idEditando !== null ? String(idEditando) : id;

  const resultado = validarFormulario(idFinal, nombre, correo, ciudad);
  if (resultado !== 'ok') {
    mostrarMensaje(obtenerTextoError(resultado, idFinal), 'error');
    return; // se sale y no se agrega nada
  }

  if (idEditando !== null) {
    // Modificar: map recorre el array y cambia solo el usuario con ese id
    usuarios = usuarios.map((u) =>
      u.id === idEditando ? { id: idEditando, nombre, correo, ciudad } : u
    );
    mostrarMensaje(`Usuario ${idEditando} actualizado correctamente`, 'exito');
  } else {
    // Agregar: push mete el nuevo objeto al final del array
    usuarios.push({ id: Number(idFinal), nombre, correo, ciudad });
    mostrarMensaje(`Usuario ${nombre} agregado correctamente`, 'exito');
  }

  actualizarVista();
  reiniciarFormulario();
});

// ===== Evento input del buscador: filtra mientras se escribe =====
buscador.addEventListener('input', () => {
  dibujarTabla(obtenerFiltrados());
});

// ===== Evento click sobre el tbody (delegación de eventos) =====
// En vez de ponerle un evento a cada botón, se escucha en el tbody y se mira qué botón se pulsó
cuerpoTabla.addEventListener('click', (event) => {
  const boton = event.target;
  const id = Number(boton.dataset.id); // id guardado en data-id

  if (boton.classList.contains('editar')) {
    // find busca el usuario con ese id
    const usuario = usuarios.find((u) => u.id === id);
    const { nombre, correo, ciudad } = usuario;

    // Se cargan los datos en el formulario
    inputId.value = id;
    inputNombre.value = nombre;
    inputCorreo.value = correo;
    inputCiudad.value = ciudad;

    inputId.disabled = true; // el id no se puede cambiar al editar
    idEditando = id;
    botonEnviar.textContent = 'Guardar cambios';
    tituloFormulario.textContent = `Editando usuario ${id}`;
    botonCancelar.classList.remove('oculto');
    mostrarMensaje(`Editando al usuario ${nombre}`, 'info');
  }

  if (boton.classList.contains('eliminar')) {
    // confirm pregunta al usuario y devuelve true si acepta
    const acepta = confirm(`¿Seguro que quieres eliminar al usuario con id ${id}?`);
    if (acepta) {
      // filter deja todos los usuarios menos el que tiene ese id
      usuarios = usuarios.filter((u) => u.id !== id);

      // Si justo se estaba editando ese usuario, se cancela la edición
      if (idEditando === id) {
        reiniciarFormulario();
      }
      actualizarVista();
      mostrarMensaje(`Usuario ${id} eliminado correctamente`, 'exito');
    }
  }
});

// ===== Botón cancelar de la edición =====
botonCancelar.addEventListener('click', () => {
  reiniciarFormulario();
  mostrarMensaje('Edición cancelada', 'info');
});

// ===== Inicio: al abrir la página se cargan los usuarios =====
cargarUsuarios();
