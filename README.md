# TaskCodeBack - Frontend

🚀 **Frontend completo en Next.js 14** para la aplicación de gestión de actividades TaskCodeBack.

![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-blue)

## 📋 Descripción

Aplicación web moderna construida con Next.js 14 (App Router) que permite a desarrolladores gestionar sus actividades de trabajo de forma individual o como parte de un equipo. Se conecta perfectamente con la API de Spring Boot.

## ✨ Características Implementadas

### 🔐 **Sistema de Autenticación Completo**
- ✅ Registro de desarrolladores individuales
- ✅ Registro de team leaders con creación de equipo
- ✅ Login/logout con JWT
- ✅ Protección de rutas automática
- ✅ Verificación de tokens y refresh automático
- ✅ Redirecciones inteligentes post-auth

### 🎨 **Interfaz de Usuario Moderna**
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Componentes UI con shadcn/ui
- ✅ Tema profesional con Tailwind CSS
- ✅ Loading states y feedback visual
- ✅ Notificaciones toast
- ✅ Validación de formularios en tiempo real

### 📊 **Dashboard Diferenciado**
- ✅ Panel para desarrolladores individuales
- ✅ Panel especial para team leaders
- ✅ Información del usuario y equipo
- ✅ Generación de códigos de equipo
- ✅ Estadísticas preparadas para futuras funcionalidades

### 🛡️ **Seguridad y UX**
- ✅ Manejo robusto de errores
- ✅ Validación de contraseñas con feedback
- ✅ Gestión automática de tokens JWT
- ✅ Logout automático en token expirado

## 🏗️ Estructura del Proyecto

```
taskcodefront/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   │   ├── login/         # Página de login
│   │   └── register/      # Página de registro
│   ├── dashboard/         # Dashboard principal
│   ├── layout.tsx         # Layout raíz con providers
│   ├── page.tsx          # Landing page
│   └── globals.css       # Estilos globales
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes UI base (shadcn/ui)
│   ├── auth/            # Formularios de autenticación
│   ├── layout/          # Header, sidebar, etc.
│   └── dashboard/       # Componentes del dashboard
├── context/             # Contextos de React
│   └── AuthContext.tsx  # Gestión global de autenticación
├── hooks/               # Hooks personalizados
│   ├── useAuth.ts       # Hook de autenticación
│   ├── useApi.ts        # Hook para llamadas API
│   ├── useLocalStorage.ts # Persistencia local
│   └── useToast.ts      # Notificaciones
└── lib/                 # Utilidades y configuración
    ├── api.ts           # Cliente HTTP para API
    ├── types.ts         # Tipos TypeScript
    └── utils.ts         # Funciones utilitarias
```

## 🚀 Instalación y Uso

### Prerrequisitos
- **Node.js** 18.17+ 
- **npm** o **yarn**
- **Backend Spring Boot** corriendo en `http://localhost:8080`

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno (opcional)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### 4. Construir para producción
```bash
npm run build
npm start
```

## 🔧 Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Construir para producción  
npm run start      # Servir build de producción
npm run lint       # Verificar código con ESLint
```

## 🎯 Flujo de Usuario

### 1. **Landing Page** (`/`)
- Página de bienvenida con información del producto
- Botones para login/registro
- Redirección automática si ya está autenticado

### 2. **Registro** (`/register`)
- Selector de tipo: Individual vs Team Leader
- Formulario dinámico según el tipo seleccionado
- Validación en tiempo real
- Creación automática de equipo para team leaders

### 3. **Login** (`/login`)
- Formulario simple con validación
- Manejo de errores amigable
- Redirección automática al dashboard

### 4. **Dashboard** (`/dashboard`)
- **Individual**: Panel personal con estadísticas
- **Team Leader**: Panel con info de equipo + generación de códigos
- Header con información del usuario
- Logout desde cualquier lugar

## 🔗 Integración con la API

### Endpoints Utilizados
```typescript
// Base URL: http://localhost:8080

// Autenticación
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/register-team-leader
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/generate-team-code
```

### Gestión de Tokens
- Almacenamiento automático en `localStorage`
- Verificación de expiración
- Refresh automático
- Headers automáticos en peticiones

## 🎨 Tecnologías Utilizadas

- **Framework**: Next.js 16.2.4 (App Router)
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Iconos**: Lucide React
- **Formularios**: react-hook-form + zod
- **Estado**: React Context + useReducer
- **HTTP**: Fetch API nativo

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Tailwind CSS
Configuración personalizada con:
- Variables CSS para temas
- Componentes de shadcn/ui
- Paleta de colores profesional
- Responsive design

### TypeScript
Configuración estricta con:
- Strict mode habilitado
- Paths absolutos configurados
- Tipos fuertemente tipados

## 🚧 Próximas Funcionalidades

El frontend está preparado para expandirse con:

- 📋 **Gestión de Actividades**: CRUD completo
- 👥 **Administración de Equipos**: Invitar/remover miembros
- 📊 **Reportes y Analytics**: Dashboard con métricas reales
- 🔔 **Notificaciones**: Sistema en tiempo real
- ⚙️ **Configuraciones**: Personalización de cuenta

## 🐛 Resolución de Problemas

### Error de conexión con la API
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8080/api/auth/me
```

### Problemas con dependencias
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problemas de desarrollo
```bash
# Limpiar caché de Next.js
rm -rf .next
npm run dev
```

## 📱 Responsive Design

✅ **Móvil** (320px+): Stack vertical, navegación simplificada  
✅ **Tablet** (768px+): Layout híbrido  
✅ **Desktop** (1024px+): Layout completo con sidebar

## 🎯 Estado del Proyecto

**🟢 COMPLETO Y LISTO PARA USAR**

- ✅ Sistema de autenticación funcional
- ✅ Dashboard diferenciado por tipo de usuario  
- ✅ Integración completa con API de Spring Boot
- ✅ UI/UX moderna y responsive
- ✅ Manejo de errores y loading states
- ✅ Código limpio y bien documentado

## ✨ **NUEVO: Sistema de Verificación por Email**

### 🎯 **Funcionalidades implementadas**

- **📧 Verificación por código de 6 dígitos**: Sistema seguro de verificación
- **⏱️ Countdown timer**: Control de reenvío con timer de 60 segundos
- **🔄 Auto-advance**: Input inteligente que avanza automáticamente
- **📱 Responsive**: Diseño optimizado para móviles y desktop
- **🎨 Animaciones**: Efectos visuales para errores (shake) y transiciones
- **👥 Soporte para team leaders**: Flujo diferenciado con configuración de equipo

### 🚀 **Cómo usar el nuevo sistema**

1. **Acceder al nuevo flujo**:
   ```
   http://localhost:3000/register/verify
   ```

2. **Paso 1: Información inicial**
   - Ingresar email y nombre completo
   - Seleccionar tipo: Individual o Team Leader
   - El sistema envía código de 6 dígitos al email

3. **Paso 2: Verificación y registro**
   - Ingresar código de 6 dígitos (con auto-avance)
   - Crear contraseña segura
   - **Team Leaders**: Configurar nombre y descripción del equipo
   - Completar registro automáticamente

### 🔧 **Componentes nuevos**

```
components/auth/
├── EmailVerificationStep.tsx      # Paso 1: Email y tipo de usuario
├── CodeVerificationStep.tsx       # Paso 2: Código y registro
├── VerificationCodeInput.tsx      # Input especializado de 6 dígitos
└── CountdownTimer.tsx             # Timer para reenvío de códigos

hooks/
├── useVerification.ts             # Lógica completa de verificación
├── useCodeInput.ts                # Manejo del input de códigos
└── useCountdown.ts                # Lógica del countdown timer

app/(auth)/register/verify/        # Nueva página de verificación
```

### 📡 **Endpoints del backend requeridos**

```typescript
// Enviar código de verificación
POST /api/auth/verification/send
{
  "email": "usuario@example.com",
  "fullName": "Nombre Completo",
  "userType": "INDIVIDUAL" | "TEAM_LEADER"
}

// Verificar código y registrar usuario
POST /api/auth/verification/verify
{
  "email": "usuario@example.com",
  "verificationCode": "123456",
  "password": "password123",
  "fullName": "Nombre Completo"
}

// Verificar código y registrar team leader
POST /api/auth/verification/verify/team-leader
{
  "email": "leader@example.com",
  "verificationCode": "123456",
  "password": "password123",
  "fullName": "Nombre Leader",
  "teamName": "Mi Equipo",
  "teamDescription": "Descripción del equipo"
}
```

### 🎨 **Características de UX**

- **Auto-focus**: El cursor se mueve automáticamente entre campos
- **Paste support**: Pegar códigos de 6 dígitos automáticamente
- **Error feedback**: Animación shake para códigos incorrectos
- **Loading states**: Feedback visual durante las operaciones
- **Validación en tiempo real**: Mensajes de error inmediatos
- **Responsive design**: Funciona perfectamente en móviles

### 🔒 **Seguridad**

- Validación client-side con Zod
- Sanitización de inputs
- Manejo seguro de tokens JWT
- Timeout automático para códigos
- Rate limiting en el frontend

## 🤝 Contribución

1. Hacer fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

**¡Tu aplicación TaskCodeBack está lista para conectarse con tu backend de Spring Boot! 🎉**
