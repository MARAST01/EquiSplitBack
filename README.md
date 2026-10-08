# EquiSplit — Backend

API REST de **EquiSplit**, una plataforma para gestionar gastos compartidos y distribuir las responsabilidades financieras de manera proporcional a los ingresos de los participantes.

El backend está construido con **NestJS**, utiliza **PostgreSQL** como base de datos y contiene la lógica de negocio encargada de calcular participaciones, obligaciones, saldos y liquidaciones.

---

## Estado del proyecto

**En desarrollo**

El backend se está construyendo incrementalmente mediante tareas pequeñas, priorizando separación de responsabilidades, seguridad, testabilidad y consistencia de las reglas financieras.

---

## Objetivo

El backend de EquiSplit tiene como responsabilidad:

- gestionar usuarios;
- autenticar usuarios;
- administrar grupos;
- administrar ciclos financieros;
- registrar ingresos;
- registrar gastos;
- calcular participaciones;
- calcular obligaciones;
- calcular saldos;
- generar liquidaciones;
- garantizar las reglas de negocio;
- controlar la autorización de acceso a los recursos.

El frontend nunca será la fuente de verdad de los cálculos financieros.

---

## Arquitectura

Arquitectura general:

```text
┌──────────────────────────────┐
│           Angular            │
│           Frontend           │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│           NestJS             │
│            API               │
├──────────────────────────────┤
│                              │
│ Auth                         │
│ Users                        │
│ Groups                       │
│ Cycles                       │
│ Incomes                      │
│ Expenses                     │
│ Settlement                   │
│ Audit                        │
│                              │
│ Financial Engine             │
│                              │
└──────────────┬───────────────┘
               │
               │ SQL
               ▼
┌──────────────────────────────┐
│         PostgreSQL           │
│            Neon              │
└──────────────────────────────┘
```

Infraestructura prevista:

```text
Frontend  → Vercel
Backend   → Railway
Database  → Neon
Código    → Git
```

---

## Motor financiero

Uno de los componentes principales de EquiSplit es el motor financiero.

Su responsabilidad es transformar los datos registrados por los usuarios en resultados financieros consistentes.

Flujo general:

```text
Ingresos
   ↓
Total de ingresos
   ↓
Participación de cada usuario
   ↓
Gastos
   ↓
Participantes afectados
   ↓
Obligaciones
   ↓
Pagos realizados
   ↓
Saldos
   ↓
Liquidación
   ↓
Transferencias mínimas
```

El motor financiero debe estar desacoplado de los controllers y de la capa HTTP para que pueda probarse independientemente.

---

## Reglas financieras principales

### Participación

La participación general de un usuario se calcula como:

```text
participación =
ingresosUsuario /
ingresosTotales
```

### Gastos parciales

Cuando un gasto solo afecta a determinados participantes, la distribución se calcula utilizando únicamente los ingresos de esos participantes.

```text
participaciónEnGasto =
ingresosUsuario /
ingresosParticipantesGasto
```

### Obligación

```text
obligación =
montoGasto × participaciónEnGasto
```

### Saldo

```text
saldo =
totalPagado -
totalObligacion
```

Interpretación:

```text
saldo > 0
→ recibe dinero

saldo < 0
→ debe pagar

saldo = 0
→ equilibrado
```

### Invariantes

El sistema debe garantizar:

```text
Σ participaciones = 100%
Σ obligaciones de un gasto = monto del gasto
Σ saldos = 0
Σ dinero enviado = Σ dinero recibido
```

Estas reglas están documentadas en:

```text
docs/business-rules.md
```

---

## Autenticación y autorización

La API utiliza autenticación basada en **JWT**.

Flujo general:

```text
Cliente
   ↓
POST /auth/login
   ↓
Validación de credenciales
   ↓
JWT
   ↓
Authorization: Bearer <token>
   ↓
JwtAuthGuard
   ↓
Endpoint protegido
```

Además de la autenticación, el backend debe comprobar que el usuario tenga acceso al recurso solicitado.

Por ejemplo:

```text
Usuario
   ↓
Grupo
   ↓
Ciclo
   ↓
Gasto
```

Que un usuario conozca un ID no implica que tenga permiso para consultar o modificar ese recurso.

---

## Módulos principales

La estructura inicial estará orientada a módulos de dominio:

```text
src/
├── auth/
├── users/
├── groups/
├── cycles/
├── incomes/
├── expenses/
├── settlement/
├── audit/
└── common/
```

La estructura podrá evolucionar conforme aumente la complejidad del proyecto.

---

## Estructura de proyecto prevista

```text
src/
├── auth/
│   ├── guards/
│   ├── strategies/
│   ├── dto/
│   └── ...
│
├── users/
│   ├── dto/
│   ├── entities/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
│
├── groups/
├── cycles/
├── incomes/
├── expenses/
├── settlement/
├── audit/
│
├── common/
│   ├── filters/
│   ├── interceptors/
│   ├── decorators/
│   ├── exceptions/
│   └── ...
│
├── app.module.ts
└── main.ts
```

La estructura definitiva dependerá de las decisiones tomadas durante el desarrollo.

---

## Tecnologías

- NestJS
- TypeScript
- Node.js
- PostgreSQL
- TypeORM
- JWT
- Jest
- REST API
- Git

Las dependencias adicionales deberán incorporarse únicamente cuando resuelvan una necesidad concreta del proyecto.

---

## Requisitos

Para ejecutar el backend localmente se necesita:

- Node.js
- npm
- PostgreSQL
- Git

Comprobar versiones:

```bash
node --version
npm --version
git --version
```

---

## Instalación

Clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Entra al proyecto:

```bash
cd equisplit-back
```

Instala las dependencias:

```bash
npm install
```

---

## Configuración

Crea un archivo `.env` para el entorno local.

Ejemplo:

```env
NODE_ENV=development

PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

JWT_SECRET=your-secret
JWT_EXPIRES_IN=1d
```

Los valores reales no deben almacenarse en Git.

Debe existir un archivo de referencia:

```text
.env.example
```

sin credenciales reales.

---

## Base de datos

EquiSplit utiliza PostgreSQL.

Durante desarrollo se puede utilizar una instancia local.

La base de producción estará alojada en **Neon**.

La aplicación debe utilizar migraciones para controlar la evolución del esquema.

Flujo esperado:

```text
Entidad
   ↓
Migración
   ↓
PostgreSQL
```

No se deben utilizar modificaciones manuales de la base de datos como mecanismo principal de evolución del esquema.

---

## Ejecución

Modo desarrollo:

```bash
npm run start:dev
```

Modo normal:

```bash
npm run start
```

Build:

```bash
npm run build
```

Producción:

```bash
npm run start:prod
```

La API estará disponible normalmente en:

```text
http://localhost:3000
```

---

## Health Check

El backend contará con un endpoint para comprobar el estado de la aplicación.

Ejemplo:

```http
GET /health
```

Respuesta conceptual:

```json
{
  "status": "ok"
}
```

Este endpoint también podrá utilizarse para comprobar el estado del deployment en Railway.

---

## API REST

La API estará organizada por recursos.

Ejemplos conceptuales:

```text
POST   /auth/login
POST   /auth/register

GET    /users/me

POST   /groups
GET    /groups/mine
POST   /groups/:id/members
DELETE /groups/:id/members/:userId

POST   /cycles
GET    /groups/:id/cycles
PATCH  /cycles/:id/close

POST   /incomes
GET    /cycles/:id/incomes

POST   /expenses
GET    /cycles/:id/expenses

GET    /cycles/:id/summary
GET    /cycles/:id/settlement
```

Los endpoints definitivos se definirán conforme se implementen las tareas del backlog.

---

## Separación de responsabilidades

El backend seguirá una separación clara entre:

```text
Controller
   ↓
Service
   ↓
Domain / Business Logic
   ↓
Repository / ORM
   ↓
Database
```

### Controllers

Responsables de:

- recibir requests;
- validar DTOs;
- delegar operaciones;
- devolver respuestas HTTP.

### Services

Responsables de:

- coordinar casos de uso;
- aplicar reglas de negocio;
- controlar transacciones cuando corresponda.

### Motor financiero

Responsable exclusivamente de los cálculos financieros.

No debe depender directamente de:

- HTTP;
- Controllers;
- Angular;
- Request;
- Response.

Esto permitirá probarlo de forma aislada.

---

## Manejo de dinero

El MVP utilizará:

```text
COP
```

Los valores monetarios se almacenarán como cantidades enteras de pesos colombianos.

Ejemplo:

```text
$150.000
```

se maneja como:

```text
150000
```

El proyecto evitará utilizar `float` como representación principal de valores monetarios.

---

## Seguridad

El backend debe garantizar:

- autenticación mediante JWT;
- autorización por recurso;
- validación de DTOs;
- protección de endpoints privados;
- manejo seguro de contraseñas;
- no exposición de hashes;
- no exposición de secretos;
- errores controlados;
- validación de pertenencia a grupos;
- bloqueo de modificaciones sobre ciclos cerrados.

El frontend nunca debe ser considerado una capa de seguridad.

Toda autorización importante debe realizarse en el backend.

---

## Testing

El backend utilizará **Jest** para pruebas.

Se priorizarán especialmente las pruebas de:

### Motor financiero

- cálculo de participación;
- distribución proporcional;
- distribución parcial;
- usuarios sin ingresos;
- ingresos totales en cero;
- redondeos;
- obligaciones;
- saldos;
- liquidación;
- minimización de transferencias.

### API

- autenticación;
- autorización;
- creación de grupos;
- ciclos;
- ingresos;
- gastos;
- cierre de ciclos;
- endpoints protegidos.

---

## Calidad de datos

El backend debe impedir estados financieros inconsistentes.

Ejemplos de datos inválidos:

```text
Ingreso negativo
Gasto negativo
Gasto de valor cero
Participantes duplicados
Gasto sin participantes
Gasto sin pagador
Pagador fuera del grupo
Usuario fuera del ciclo
Distribución con ingresos relevantes iguales a cero
```

Las validaciones deben ocurrir en backend independientemente de las validaciones realizadas por Angular.

---

## Ciclos financieros

Los ciclos funcionan como unidades independientes de cálculo.

Un ciclo puede encontrarse inicialmente en:

```text
OPEN
CLOSED
```

### OPEN

Permite modificaciones según permisos.

### CLOSED

Es de solo lectura para la información financiera.

Al cerrar un ciclo se debe:

```text
Validar ciclo
   ↓
Calcular participación
   ↓
Calcular obligaciones
   ↓
Calcular saldos
   ↓
Generar liquidación
   ↓
Persistir resultado
   ↓
Marcar como CLOSED
```

La operación debe ejecutarse de manera transaccional.

---

## Auditoría

EquiSplit tendrá un sistema de auditoría para registrar acciones importantes.

Ejemplos:

```text
USER_CREATED
GROUP_CREATED
MEMBER_ADDED
INCOME_CREATED
EXPENSE_CREATED
EXPENSE_UPDATED
CYCLE_CLOSED
```

Los eventos deberán permitir identificar:

```text
quién
qué hizo
sobre qué entidad
cuándo
```

---

## Ejemplo del motor financiero

Entrada:

```text
Ingresos:

Marlon = $3.000.000
Juan   = $2.000.000
Carlos = $1.000.000
```

Gasto:

```text
$600.000
```

Participantes:

```text
Marlon
Juan
Carlos
```

Resultado:

```text
Marlon = $300.000
Juan   = $200.000
Carlos = $100.000
```

Si posteriormente:

```text
Marlon pagó = $500.000
Juan pagó   = $100.000
Carlos pagó = $0
```

las obligaciones serían:

```text
Marlon = $300.000
Juan   = $200.000
Carlos = $100.000
```

y los saldos:

```text
Marlon = +$200.000
Juan   = -$100.000
Carlos = -$100.000
```

Liquidación:

```text
Juan   → Marlon $100.000
Carlos → Marlon $100.000
```

---

## Documentación

La documentación funcional y de negocio se encuentra en:

```text
docs/
├── vision.md
└── business-rules.md
```

### `vision.md`

Define:

- problema;
- objetivo;
- usuarios;
- alcance;
- MVP;
- arquitectura general.

### `business-rules.md`

Define:

- reglas de distribución;
- ingresos;
- gastos;
- gastos parciales;
- redondeos;
- saldos;
- liquidaciones;
- invariantes;
- reglas de validación.

---

## 🌿 Flujo de desarrollo

Ramas principales:

```text
main
develop
```

Nuevas funcionalidades:

```text
feature/<nombre>
```

Correcciones:

```text
fix/<nombre>
```

Flujo:

```text
develop
   ↓
feature/*
   ↓
Pull Request
   ↓
develop
   ↓
main
```

---

## Convenciones de desarrollo

Se busca mantener:

- servicios pequeños y enfocados;
- controllers delgados;
- DTOs para entrada de datos;
- lógica de negocio fuera de controllers;
- errores de negocio explícitos;
- código tipado con TypeScript;
- dependencias justificadas;
- tests para lógica crítica;
- separación entre datos persistidos y datos derivados.

---

## Deployment

El backend está diseñado para desplegarse en **Railway**.

Arquitectura de producción:

```text
Angular
   │
   │ HTTPS
   ▼
Railway
NestJS API
   │
   │ PostgreSQL
   ▼
Neon
```

El deployment debe utilizar variables de entorno para:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
PORT
CORS_ORIGIN
```

Los valores reales nunca deberán almacenarse en Git.

---

## CI/CD

Está previsto implementar un pipeline que ejecute como mínimo:

```text
Install
   ↓
Lint
   ↓
Tests
   ↓
Build
```

Los Pull Requests no deberían integrarse si fallan las validaciones críticas.

---

## Roadmap

El desarrollo del backend está organizado mediante tareas `EQUI-*`.

Principales etapas:

```text
EQUI-001  → Alcance
EQUI-002  → Reglas de negocio
EQUI-003  → Repositorio
EQUI-004  → Flujo Git
EQUI-005  → Base NestJS
EQUI-007  → PostgreSQL
EQUI-009  → Modelo de datos
EQUI-012  → Usuarios
EQUI-013  → Registro
EQUI-014  → Login
...
EQUI-045  → Tests de liquidación
...
EQUI-068  → Deployment Railway
...
```

El backlog completo contiene las 92 tareas del proyecto.

---

## Proyecto

**EquiSplit** es un proyecto personal desarrollado para aplicar y demostrar conocimientos de desarrollo backend y Full-Stack, incluyendo:

- NestJS;
- TypeScript;
- REST APIs;
- PostgreSQL;
- autenticación y autorización;
- modelado de datos;
- reglas de negocio;
- algoritmos;
- testing;
- auditoría;
- Docker/entornos cuando aplique;
- CI/CD;
- despliegue en la nube.

Uno de los objetivos técnicos principales es demostrar que el backend no se limita a operaciones CRUD, sino que contiene un **motor financiero independiente, testeable y basado en reglas de negocio explícitas**.

---

