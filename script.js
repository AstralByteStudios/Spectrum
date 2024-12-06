// Importar Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Contenedor de la galería
const galleryContainer = document.getElementById("gallery");
const loadingScreen = document.getElementById("loading-screen");

// Referencia a la carpeta en Storage
const fondosRef = ref(storage, "fondos/");

// Detectar categoría a partir del nombre del archivo
function detectCategory(fileName) {
  if (fileName.toLowerCase().includes("agallas")) return "agallas";
  if (fileName.toLowerCase().includes("animal-crossing"))
    return "animal-crossing";
  if (fileName.toLowerCase().includes("coco")) return "coco";
  if (fileName.toLowerCase().includes("escultura")) return "escultura";
  if (fileName.toLowerCase().includes("frozen")) return "frozen";
  if (fileName.toLowerCase().includes("gru")) return "gru";
  if (fileName.toLowerCase().includes("guardianes-de-la-galaxia"))
    return "guardianes-de-la-galaxia";
  if (fileName.toLowerCase().includes("inside-out")) return "inside-out";
  if (fileName.toLowerCase().includes("los-increibles"))
    return "los-increibles";
  if (fileName.toLowerCase().includes("monsters-ink")) return "monsters-ink";
  if (fileName.toLowerCase().includes("paisajes")) return "paisajes";
  if (fileName.toLowerCase().includes("pantera-rosa")) return "pantera-rosa";
  if (fileName.toLowerCase().includes("pica-piedra")) return "pica-piedra";
  if (fileName.toLowerCase().includes("ratatuille")) return "ratatuille";
  if (fileName.toLowerCase().includes("robot")) return "robot";
  if (fileName.toLowerCase().includes("spiderman")) return "spiderman";
  if (fileName.toLowerCase().includes("superman")) return "superman";
  if (fileName.toLowerCase().includes("tarzan")) return "tarzan";
  if (fileName.toLowerCase().includes("tom-&-jerry")) return "tom-&-jerry";
  if (fileName.toLowerCase().includes("toy-story")) return "toy-story";
  if (fileName.toLowerCase().includes("zootopia")) return "zootopia";
  if (fileName.toLowerCase().includes("south-park")) return "south-park";
  return "otros";
}

// Obtener y mostrar imágenes
listAll(fondosRef)
  .then((res) => {
    res.items.forEach((itemRef) => {
      getDownloadURL(itemRef)
        .then((url) => {
          const fileName = itemRef.name; // Nombre del archivo
          const category = detectCategory(fileName); // Detectar categoría

          // Crear tarjeta
          const card = document.createElement("div");
          card.classList.add("card");
          card.setAttribute("data-category", category); // Asignar categoría

          const img = document.createElement("img");
          img.src = url;
          img.alt = fileName;

          const downloadBtn = document.createElement("a");
          downloadBtn.classList.add("download-btn");
          downloadBtn.href = url;
          downloadBtn.download = fileName;
          downloadBtn.target = "_blank"; // Abrir en una nueva pestaña
          downloadBtn.textContent = "Descargar";

          card.appendChild(img);
          card.appendChild(downloadBtn);
          galleryContainer.appendChild(card);

          // Mostrar modal al hacer clic en la imagen
          img.addEventListener("click", () => showModal(url));
        })
        .catch((error) => {
          console.error(
            `Error al obtener la URL de la imagen: ${itemRef.name}`,
            error
          );
        });
    });
  })
  .catch((error) => {
    console.error("Error al cargar imágenes:", error);
  })
  .finally(() => {
    // Mantener la pantalla de carga visible durante 1 segundo adicional
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 5000); // 5000 ms = 5 segundos
  });

// Modal
const modal = document.querySelector(".modal");
const modalImg = modal.querySelector("#modal-image");
const closeModal = modal.querySelector(".close");

function showModal(imageUrl) {
  modalImg.src = imageUrl;
  modal.classList.add("visible");
}

closeModal.addEventListener("click", () => {
  modal.classList.remove("visible");
});

// Cerrar modal al hacer clic en el fondo
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.remove("visible");
  }
});

// Filtros
const filterToggle = document.querySelector(".filter-toggle");
const filterList = document.querySelector(".filter-list");

// Mostrar/ocultar la lista de filtros al hacer clic
filterToggle.addEventListener("click", () => {
  filterList.classList.toggle("hidden");
  filterList.classList.toggle("visible");
});

// Aplicar el filtro cuando se selecciona una categoría
filterList.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    const category = event.target.getAttribute("data-category");
    filterImages(category);

    // Cerrar la lista después de seleccionar un filtro
    filterList.classList.add("hidden");
    filterList.classList.remove("visible");

    // Cambiar el texto del botón al filtro seleccionado
    filterToggle.textContent = `Filtro: ${event.target.textContent}`;
  }
});

// Filtrar imágenes por categoría
function filterImages(category) {
  const cards = galleryContainer.querySelectorAll(".card");
  cards.forEach((card) => {
    if (category === "all" || card.getAttribute("data-category") === category) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}
