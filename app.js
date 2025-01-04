import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

let wallpapers = []; // Array to store wallpaper URLs
let favorites = []; // Array to store favorite wallpapers
let currentImageIndex = 0; // To track the currently displayed image in the modal
let showOnlyFavorites = false; // Track if only favorites should be shown

// Handle loading screen
window.addEventListener("load", () => {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loadingScreen");
    loadingScreen.style.display = "none";
  }, 5000); // 5000 ms = 5 segundos
});

// Modal elements
const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeBtn = document.getElementsByClassName("close")[0];
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

// Close the modal when the user clicks the "X"
closeBtn.onclick = closeModal;

// Close the modal if the user clicks outside the image
window.onclick = (event) => {
  if (event.target === modal) {
    closeModal();
  }
};

// Close the modal if the user presses the ESC key
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
  // Navigate images with the arrow keys (left and right)
  if (event.key === "ArrowLeft") {
    prevButton.onclick(); // Trigger previous button action
  } else if (event.key === "ArrowRight") {
    nextButton.onclick(); // Trigger next button action
  }
});

// Function to open the modal with the clicked image
function openInModal(url) {
  currentImageIndex = wallpapers.indexOf(url); // Get the index of the clicked image
  modal.style.display = "flex"; // Show the modal (flex for centering)
  modalImage.src = url; // Set the modal image source to the clicked wallpaper
}

// Function to close the modal
function closeModal() {
  modal.style.display = "none";
}

// Function to navigate to the previous image in the modal
prevButton.onclick = () => {
  currentImageIndex =
    (currentImageIndex - 1 + wallpapers.length) % wallpapers.length;
  modalImage.src = wallpapers[currentImageIndex];
};

// Function to navigate to the next image in the modal
nextButton.onclick = () => {
  currentImageIndex = (currentImageIndex + 1) % wallpapers.length;
  modalImage.src = wallpapers[currentImageIndex];
};

// Function to load wallpapers (all or only favorites)
async function loadWallpapers() {
  const wallpapersContainer = document.getElementById("wallpapersContainer");
  wallpapersContainer.innerHTML = ""; // Clear current wallpapers
  const storageRef = ref(storage, "fondos/");
  try {
    const res = await listAll(storageRef);

    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      wallpapers.push(url);

      // Only add favorites if showOnlyFavorites is true
      if (showOnlyFavorites && !favorites.includes(url)) {
        continue; // Skip wallpapers that are not in favorites
      }

      const wallpaperDiv = document.createElement("div");
      wallpaperDiv.className = "wallpaper";

      const image = document.createElement("img");
      image.src = url;
      image.alt = "Wallpaper";
      image.onclick = () => openInModal(url); // Open image in modal

      const openLinkButton = document.createElement("button");
      openLinkButton.innerText = "Abrir en otra pestaña";
      openLinkButton.className = "download-btn";
      openLinkButton.onclick = (event) => {
        event.stopPropagation();
        openInNewTab(url);
      };

      const favoritesButton = document.createElement("button");
      favoritesButton.className = "favorite-btn";
      favoritesButton.onclick = (event) => {
        event.stopPropagation();
        toggleFavorite(url, favoritesButton);
      };

      // Check if the current wallpaper is in the favorites array
      if (favorites.includes(url)) {
        favoritesButton.innerText = "Eliminar de favoritos";
        favoritesButton.classList.add("favorite"); // Apply yellow background and black text
      } else {
        favoritesButton.innerText = "Agregar a favoritos";
        favoritesButton.classList.remove("favorite");
      }

      wallpaperDiv.appendChild(image);
      wallpaperDiv.appendChild(openLinkButton);
      wallpaperDiv.appendChild(favoritesButton);
      wallpapersContainer.appendChild(wallpaperDiv);
    }
  } catch (error) {
    console.error("Error loading wallpapers:", error);
  }
}

// Function to open wallpaper in a new tab
function openInNewTab(url) {
  window.open(url, "_blank");
}

// Function to handle the favorite toggle
function toggleFavorite(url, button) {
  if (favorites.includes(url)) {
    favorites = favorites.filter((item) => item !== url);
    button.innerText = "Agregar a favoritos";
    button.classList.remove("favorite"); // Remove the yellow background when removed from favorites
  } else {
    favorites.push(url);
    button.innerText = "Eliminar de favoritos";
    button.classList.add("favorite"); // Apply yellow background and black text
  }
  saveFavorites(); // Save favorites to Firebase
}

// Function to save favorites to Firebase
function saveFavorites() {
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    console.log("Saving favorites to Firebase", favorites); // Add logging for debugging
    set(dbRef(db, "favorites/" + userId), favorites) // Save to Firebase Realtime Database
      .then(() => {
        console.log("Favorites saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving favorites:", error);
      });
  } else {
    console.log("No user is signed in, unable to save favorites.");
  }
}

// Function to load favorites from Firebase
function loadFavorites() {
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const favoritesRef = dbRef(db, "favorites/" + userId);
    get(favoritesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          favorites = snapshot.val() || [];
        }
        updateFavoriteButtons(); // Update the buttons once favorites are loaded
      })
      .catch((error) => {
        console.error("Error al cargar los favoritos:", error);
      });
  }
}

// Function to update the state of the favorite buttons based on the favorites array
function updateFavoriteButtons() {
  const buttons = document.querySelectorAll(".favorite-btn");
  buttons.forEach((button) => {
    const wallpaperUrl = button.previousSibling.src; // Get the image URL
    if (favorites.includes(wallpaperUrl)) {
      button.innerText = "Eliminar de favoritos";
      button.classList.add("favorite");
    } else {
      button.innerText = "Agregar a favoritos";
      button.classList.remove("favorite");
    }
  });
}

// Authentication logic
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const welcomeMessage = document.getElementById("welcomeMessage");

loginButton.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Usuario conectado:", user);

    // Actualizar la interfaz al iniciar sesión
    welcomeMessage.innerHTML = `
  <div class="welcome-container">
  <img src="${user.photoURL}" alt="Foto de perfil" class="profile-photo">
    <span>Hola, ${user.displayName || "Usuario"}!</span>
  </div>
`;
    welcomeMessage.style.display = "block";
    loginButton.style.display = "none";
    logoutButton.style.display = "block";

    loadFavorites(); // Cargar los favoritos cuando el usuario se conecta
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);

    // Actualizar la interfaz al cerrar sesión
    welcomeMessage.textContent = "";
    welcomeMessage.style.display = "none";
    loginButton.style.display = "block";
    logoutButton.style.display = "none";
    console.log("Usuario desconectado");

    // Limpiar los favoritos cuando el usuario cierra sesión
    favorites = [];
    saveFavorites(); // Ensure favorites are cleared from Firebase
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const displayName = user.displayName || "Usuario";
    console.log("Usuario conectado:", user);
    welcomeMessage.innerHTML = `
      <div class="welcome-container">
        <img src="${user.photoURL}" alt="Foto de perfil" class="profile-photo">
        <span>Hola, ${displayName}!</span>
      </div>
    `;
    welcomeMessage.style.display = "block";
    loginButton.style.display = "none";
    logoutButton.style.display = "block";
    loadFavorites(); // Cargar los favoritos al iniciar sesión
  }
});

// Load all wallpapers initially
loadWallpapers();

// Show favorites only when button is clicked
document.getElementById("showFavoritesButton").addEventListener("click", () => {
  showOnlyFavorites = !showOnlyFavorites; // Toggle between showing all or only favorites
  loadWallpapers(); // Reload wallpapers based on the new state

  // Change the button text
  const button = document.getElementById("showFavoritesButton");
  if (showOnlyFavorites) {
    button.innerText = "Mostrar todos los fondos";
  } else {
    button.innerText = "Mostrar solo favoritos";
  }
});