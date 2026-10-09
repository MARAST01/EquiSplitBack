# EquiSplit — Estrategia para montos monetarios

## 1. Objetivo

Definir una representación consistente y precisa de los importes monetarios
para evitar errores de precisión, redondeos acumulados y diferencias entre
los valores registrados y los distribuidos por el motor financiero.

Esta estrategia aplica a ingresos, gastos, obligaciones, saldos y transferencias.

## 2. Decisión para el MVP

El MVP de EquiSplit trabajará exclusivamente con pesos colombianos (COP).

Las reglas iniciales serán:

- Todos los importes se expresan en pesos colombianos enteros.
- No se admitirán fracciones de peso.
- Los importes se almacenarán como números enteros.
- No se utilizarán tipos de punto flotante para representar dinero.
- Los cálculos financieros serán responsabilidad del backend.
- La interfaz podrá presentar los importes con separadores de miles,
  pero el formato visual no se almacenará en la base de datos.

Ejemplo:

| Representación visual | Valor almacenado |
|---|---:|
| $350.000 COP | 350000 |
| $1.250.000 COP | 1250000 |
| $10.001 COP | 10001 |

El punto utilizado como separador de miles en la interfaz no forma parte
del valor almacenado ni del contrato de datos.

## 3. Almacenamiento en PostgreSQL

Los campos monetarios del modelo inicial utilizarán `BIGINT`.

Este tipo almacena números enteros y permite representar cantidades
monetarias en pesos enteros sin fracciones decimales.

No se utilizarán los siguientes tipos para almacenar importes:

- `REAL`
- `FLOAT`
- `DOUBLE PRECISION`
- `MONEY`

Los tipos de punto flotante pueden introducir aproximaciones numéricas.
El tipo `NUMERIC` de PostgreSQL permite representar valores decimales exactos,
pero el MVP no necesita fracciones de peso y mantendrá `BIGINT`.

Referencia técnica:
https://www.postgresql.org/docs/current/datatype-numeric.html

Los valores almacenados serán importes sin formato. No se guardarán cadenas
como "$350.000", "COP 350.000" ni valores que incluyan separadores de miles.

## 4. Contrato de importes entre frontend y backend

Para evitar pérdidas de precisión al transportar importes, el contrato de
la API representará los montos como cadenas de dígitos, por ejemplo:

```json
{
  "amount": "350000"
}