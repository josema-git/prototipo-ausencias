import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "firebase/auth";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    getDoc,
    doc,
    updateDoc 
} from "firebase/firestore";
import Chart from 'chart.js/auto';
import './styles.css'

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('Usuario autenticado UID:', user.uid);
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                console.log('Documento de usuario encontrado:', userDoc.exists());
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('Datos del usuario:', userData);
                    currentUser = {
                        ...user,
                        role: userData.role || 'user'
                    };
                    console.log('Rol asignado:', currentUser.role);
                } else {
                    console.log('No se encontró documento para el usuario.');
                    currentUser = {
                        ...user,
                        role: 'user'
                    };
                }
                console.log('Usuario final:', currentUser);
                loadMainContent();
            } catch (error) {
                console.error('Error al obtener los datos del usuario:', error);
                currentUser = {
                    ...user,
                    role: 'user'
                };
                loadMainContent();
            }
        } else {
            currentUser = null;
            console.log('Usuario no autenticado');
            loadLoginForm();
        }
    });
});


function loadLoginForm() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar sesión
                    </h2>
                </div>
                <form class="mt-8 space-y-6" id="loginForm">
                    <input type="hidden" name="remember" value="true">
                    <div class="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label for="email-address" class="sr-only">Correo electrónico</label>
                            <input id="email-address" name="email" type="email" autocomplete="email" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Correo electrónico">
                        </div>
                        <div>
                            <label for="password" class="sr-only">Contraseña</label>
                            <input id="password" name="password" type="password" autocomplete="current-password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Contraseña">
                        </div>
                    </div>

                    <div>
                        <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Iniciar sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email-address').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Obtener el rol del usuario desde Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentUser = {
                ...user,
                role: userDoc.data().role
            };
        } else {
            currentUser = {
                ...user,
                role: 'user' // rol por defecto si no se encuentra en Firestore
            };
        }
        
        console.log('Usuario autenticado:', currentUser);
        loadMainContent();
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert('Error de autenticación. Por favor, verifica tus credenciales.');
    }
}

function loadMainContent() {
    console.log('Cargando contenido principal. Rol del usuario:', currentUser.role);
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Elemento main-content no encontrado');
        return;
    }

    console.log('Cargando contenido principal para usuario:', currentUser);

    mainContent.innerHTML = `
        <div class="min-h-full">
            <nav class="bg-gray-800">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-16 items-center justify-between">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <img class="h-8 w-8" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500" alt="Tu Compañía">
                            </div>
                            <div class="hidden md:block">
                                <div class="ml-10 flex items-baseline space-x-4">
                                    <a href="#" class="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium" id="nav-dashboard">Dashboard</a>
                                    <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium" id="nav-solicitudes">Solicitudes</a>
                                    ${currentUser.role === 'admin' ? `
                                    <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium" id="nav-admin">Administración</a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="hidden md:block">
                            <div class="ml-4 flex items-center md:ml-6">
                                <button type="button" id="logout-button" class="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <header class="bg-white shadow">
                <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <h1 class="text-3xl font-bold tracking-tight text-gray-900" id="page-title">Dashboard</h1>
                </div>
            </header>

            <main>
                <div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <div id="page-content" class="px-4 py-6 sm:px-0">
                        <!-- El contenido de la página se cargará aquí -->
                    </div>
                </div>
            </main>
        </div>
    `;

    const navDashboard = document.getElementById('nav-dashboard');
    const navSolicitudes = document.getElementById('nav-solicitudes');
    const navAdmin = document.getElementById('nav-admin');
    const logoutButton = document.getElementById('logout-button');

    if (navDashboard) {
        navDashboard.addEventListener('click', () => loadDashboard());
    }
    if (navSolicitudes) {
        navSolicitudes.addEventListener('click', () => loadSolicitudes());
    }
    if (navAdmin && currentUser.role === 'admin') {
        console.log('Añadiendo event listener para el panel de admin');
        navAdmin.addEventListener('click', () => loadAdminPanel());
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    loadDashboard(); // Carga el dashboard por defecto
}

function loadAdminPanel() {
    console.log('Cargando panel de administración');
    if (!currentUser || currentUser.role !== 'admin') {
        console.error('Acceso no autorizado al panel de administración');
        alert('No tienes permisos para acceder a esta página.');
        return;
    }

    const pageTitle = document.getElementById('page-title');
    const pageContent = document.getElementById('page-content');
    
    if (pageTitle) pageTitle.textContent = 'Panel de Administración';
    if (pageContent) {
        pageContent.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold mb-4">Solicitudes de Ausencia Pendientes</h2>
                <div id="pendingRequestsList" class="space-y-4">
                    <!-- Las solicitudes pendientes se cargarán aquí -->
                </div>
            </div>
        `;
        loadPendingRequests();
    } else {
        console.error('Elemento page-content no encontrado');
    }
}

async function loadPendingRequests() {
    const requestsList = document.getElementById('pendingRequestsList');
    requestsList.innerHTML = '<p>Cargando solicitudes pendientes...</p>';

    try {
        const q = query(collection(db, "absenceRequests"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            requestsList.innerHTML = '<p>No hay solicitudes pendientes.</p>';
            return;
        }

        let requestsHTML = '';
        querySnapshot.forEach((doc) => {
            const request = doc.data();
            requestsHTML += `
                <div class="border rounded-md p-4">
                    <p><strong>Usuario:</strong> ${request.userId}</p>
                    <p><strong>Fecha de inicio:</strong> ${request.startDate}</p>
                    <p><strong>Fecha de fin:</strong> ${request.endDate}</p>
                    <p><strong>Motivo:</strong> ${request.reason}</p>
                    <div class="mt-2">
                        <button class="bg-green-500 text-white px-4 py-2 rounded mr-2" onclick="handleRequest('${doc.id}', 'approved')">Aprobar</button>
                        <button class="bg-red-500 text-white px-4 py-2 rounded" onclick="handleRequest('${doc.id}', 'rejected')">Rechazar</button>
                    </div>
                </div>
            `;
        });

        requestsList.innerHTML = requestsHTML;
    } catch (error) {
        console.error("Error al cargar las solicitudes pendientes: ", error);
        requestsList.innerHTML = '<p>Error al cargar las solicitudes. Por favor, intenta de nuevo.</p>';
    }
}

async function handleRequest(requestId, status) {
    try {
        await updateDoc(doc(db, "absenceRequests", requestId), {
            status: status,
            updatedAt: new Date(),
            updatedBy: currentUser.uid
        });
        alert(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} con éxito.`);
        loadPendingRequests(); // Recargar la lista de solicitudes pendientes
    } catch (error) {
        console.error("Error al actualizar la solicitud: ", error);
        alert('Error al procesar la solicitud. Por favor, intenta de nuevo.');
    }
}

// Asegúrate de que estas funciones sean accesibles globalmente
window.handleRequest = handleRequest;

async function loadDashboard() {
    document.getElementById('page-title').textContent = 'Dashboard';
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 class="text-2xl font-semibold mb-4">Resumen de Ausencias</h2>
            <div id="absenceSummary" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-100 p-4 rounded-md">
                    <h3 class="font-semibold text-blue-800">Total de Solicitudes</h3>
                    <p id="totalRequests" class="text-3xl font-bold text-blue-600">-</p>
                </div>
                <div class="bg-yellow-100 p-4 rounded-md">
                    <h3 class="font-semibold text-yellow-800">Solicitudes Pendientes</h3>
                    <p id="pendingRequests" class="text-3xl font-bold text-yellow-600">-</p>
                </div>
                <div class="bg-green-100 p-4 rounded-md">
                    <h3 class="font-semibold text-green-800">Solicitudes Aprobadas</h3>
                    <p id="approvedRequests" class="text-3xl font-bold text-green-600">-</p>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold mb-4">Mis Ausencias</h2>
                <canvas id="myAbsenceChart" width="400" height="200"></canvas>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold mb-4">Ausencias del Equipo</h2>
                <canvas id="teamAbsenceChart" width="400" height="200"></canvas>
            </div>
        </div>
    `;

    await loadAbsenceSummary();
    await createMyAbsenceChart();
    await createTeamAbsenceChart();
}

async function loadAbsenceSummary() {
    try {
        const q = query(collection(db, "absenceRequests"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        let total = 0;
        let pending = 0;
        let approved = 0;

        querySnapshot.forEach((doc) => {
            const request = doc.data();
            total++;
            if (request.status === 'pending') pending++;
            if (request.status === 'approved') approved++;
        });

        document.getElementById('totalRequests').textContent = total;
        document.getElementById('pendingRequests').textContent = pending;
        document.getElementById('approvedRequests').textContent = approved;
    } catch (error) {
        console.error("Error al cargar el resumen de ausencias: ", error);
    }
}

async function createMyAbsenceChart() {
    try {
        const q = query(collection(db, "absenceRequests"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const absenceTypes = {};

        querySnapshot.forEach((doc) => {
            const request = doc.data();
            if (absenceTypes[request.reason]) {
                absenceTypes[request.reason]++;
            } else {
                absenceTypes[request.reason] = 1;
            }
        });

        const ctx = document.getElementById('myAbsenceChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(absenceTypes),
                datasets: [{
                    data: Object.values(absenceTypes),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Mis Ausencias por Motivo'
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error al crear el gráfico de mis ausencias: ", error);
    }
}

async function createTeamAbsenceChart() {
    try {
        // Asumimos que todos los usuarios pertenecen al mismo equipo por simplicidad
        const q = query(collection(db, "absenceRequests"), where("userId", "!=", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const absenceTypes = {};

        querySnapshot.forEach((doc) => {
            const request = doc.data();
            if (absenceTypes[request.reason]) {
                absenceTypes[request.reason]++;
            } else {
                absenceTypes[request.reason] = 1;
            }
        });

        const ctx = document.getElementById('teamAbsenceChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(absenceTypes),
                datasets: [{
                    label: 'Número de Ausencias',
                    data: Object.values(absenceTypes),
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Ausencias'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Motivo de Ausencia'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Ausencias del Equipo por Motivo'
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error al crear el gráfico de ausencias del equipo: ", error);
    }
}

function loadSolicitudes() {
    document.getElementById('page-title').textContent = 'Solicitudes de Ausencia';
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 class="text-2xl font-semibold mb-4">Nueva Solicitud de Ausencia</h2>
            <form id="absenceRequestForm" class="space-y-4">
                <div>
                    <label for="startDate" class="block text-sm font-medium text-gray-700">Fecha de inicio</label>
                    <input type="date" id="startDate" name="startDate" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                </div>
                <div>
                    <label for="endDate" class="block text-sm font-medium text-gray-700">Fecha de fin</label>
                    <input type="date" id="endDate" name="endDate" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                </div>
                <div>
                    <label for="reason" class="block text-sm font-medium text-gray-700">Motivo</label>
                    <textarea id="reason" name="reason" rows="3" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"></textarea>
                </div>
                <div>
                    <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Enviar Solicitud
                    </button>
                </div>
            </form>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4">Mis Solicitudes</h2>
            <div id="requestsList" class="space-y-4">
                <!-- Las solicitudes se cargarán aquí -->
            </div>
        </div>
    `;

    document.getElementById('absenceRequestForm').addEventListener('submit', handleAbsenceRequest);
    loadUserRequests();
}

async function handleAbsenceRequest(e) {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value;

    try {
        const docRef = await addDoc(collection(db, "absenceRequests"), {
            userId: currentUser.uid,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
            status: 'pending',
            createdAt: new Date()
        });
        console.log("Solicitud de ausencia creada con ID: ", docRef.id);
        alert('Solicitud de ausencia enviada con éxito');
        document.getElementById('absenceRequestForm').reset();
        loadUserRequests();
    } catch (error) {
        console.error("Error al crear la solicitud de ausencia: ", error);
        alert('Error al enviar la solicitud de ausencia');
    }
}

async function loadUserRequests() {
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '<p>Cargando solicitudes...</p>';

    try {
        const q = query(collection(db, "absenceRequests"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            requestsList.innerHTML = '<p>No tienes solicitudes de ausencia.</p>';
            return;
        }

        let requestsHTML = '';
        querySnapshot.forEach((doc) => {
            const request = doc.data();
            const statusColor = getStatusColor(request.status);
            requestsHTML += `
                <div class="border rounded-md p-4">
                    <p><strong>Fecha de inicio:</strong> ${request.startDate}</p>
                    <p><strong>Fecha de fin:</strong> ${request.endDate}</p>
                    <p><strong>Motivo:</strong> ${request.reason}</p>
                    <p><strong>Estado:</strong> <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${request.status}</span></p>
                </div>
            `;
        });

        requestsList.innerHTML = requestsHTML;
    } catch (error) {
        console.error("Error al cargar las solicitudes: ", error);
        requestsList.innerHTML = '<p>Error al cargar las solicitudes. Por favor, intenta de nuevo.</p>';
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}



function loadCalendario() {
    document.getElementById('page-title').textContent = 'Calendario';
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4">Calendario de Ausencias</h2>
            <p>Aquí se mostrará un calendario con las ausencias programadas.</p>
        </div>
    `;
}

async function handleLogout() {
    try {
        await signOut(auth);
        currentUser = null;
        console.log('Usuario desconectado');
        loadLoginForm();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}