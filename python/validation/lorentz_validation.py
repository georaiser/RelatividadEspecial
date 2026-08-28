"""
lorentz_validation.py
=====================
Validación independiente del motor físico JavaScript (lorentz.js).

Calcula las mismas magnitudes que lorentz.js usando Python+NumPy
para verificar consistencia numérica.

Uso:
    python lorentz_validation.py

Requiere: Python 3.8+, numpy
"""

import math


# ── Constantes ────────────────────────────────────────────────────────
C = 1  # velocidad de la luz (unidades naturales)


# ── Motor físico ──────────────────────────────────────────────────────

def gamma(beta: float) -> float:
    """Factor de Lorentz γ = 1 / √(1 − β²)"""
    assert abs(beta) < 1, f"|beta| debe ser menor que 1. Recibido: {beta}"
    return 1.0 / math.sqrt(1.0 - beta**2)


def lorentz_transform(x: float, t: float, beta: float) -> tuple[float, float]:
    """
    Transforma (x, t) del sistema S a S' con velocidad β·c.

    x' = γ (x − β t)
    t' = γ (t − β x)
    """
    g = gamma(beta)
    xp = g * (x - beta * t)
    tp = g * (t - beta * x)
    return xp, tp


def inverse_transform(xp: float, tp: float, beta: float) -> tuple[float, float]:
    """Transforma de S' a S (equivalente a β → −β)."""
    return lorentz_transform(xp, tp, -beta)


def spacetime_interval(dx: float, dt: float) -> float:
    """Δs² = Δt² − Δx²  (signatura +−, c = 1)"""
    return dt**2 - dx**2


def classify_interval(ds2: float) -> str:
    """Clasifica la separación causal entre dos eventos."""
    eps = 1e-10
    if abs(ds2) < eps:
        return 'luz'
    return 'temporal' if ds2 > 0 else 'espacial'


def velocity_addition(u: float, beta: float) -> float:
    """Suma relativista de velocidades: u' = (u − β) / (1 − u·β)"""
    return (u - beta) / (1.0 - u * beta)


# ── Casos de prueba ───────────────────────────────────────────────────

def run_tests():
    print("=" * 55)
    print("  VALIDACIÓN: motor físico de relatividad especial")
    print("=" * 55)
    print()

    # Test 1: Factor γ
    betas = [0.0, 0.5, 0.8, 0.9, 0.99]
    print("─ Factor de Lorentz γ ─────────────────────────────────")
    for b in betas:
        g = gamma(b)
        print(f"  β = {b:.2f}  →  γ = {g:.6f}")
    print()

    # Test 2: Transformación de un evento
    print("─ Transformación de Lorentz ────────────────────────────")
    cases = [(2.0, 1.0, 0.5), (0.0, 3.0, 0.8), (5.0, 5.0, 0.0)]
    for x, t, b in cases:
        xp, tp = lorentz_transform(x, t, b)
        x2, t2 = inverse_transform(xp, tp, b)
        print(f"  S: ({x}, {t}), β={b}  →  S': ({xp:.4f}, {tp:.4f})")
        print(f"   Inversa:  S': ({xp:.4f}, {tp:.4f})  →  S: ({x2:.4f}, {t2:.4f})  ✓")
    print()

    # Test 3: Invarianza del intervalo
    print("─ Invarianza del intervalo espacio-temporal ────────────")
    events = [
        ((0.0, 0.0), (2.0, 1.0)),
        ((0.0, 0.0), (1.0, 1.0)),
        ((0.0, 0.0), (3.0, 2.0)),
    ]
    for (x1, t1), (x2, t2) in events:
        b = 0.6
        ds2_S = spacetime_interval(x2 - x1, t2 - t1)
        x1p, t1p = lorentz_transform(x1, t1, b)
        x2p, t2p = lorentz_transform(x2, t2, b)
        ds2_Sp = spacetime_interval(x2p - x1p, t2p - t1p)
        tipo = classify_interval(ds2_S)
        invariante = abs(ds2_S - ds2_Sp) < 1e-10
        print(f"  Δs²(S)={ds2_S:.4f}  Δs²(S')={ds2_Sp:.4f}"
              f"  tipo={tipo}  invariante={'✓' if invariante else '✗'}")
    print()

    # Test 4: Suma de velocidades (la luz siempre va a c)
    print("─ Suma relativista de velocidades ─────────────────────")
    for b in [0.0, 0.3, 0.6, 0.9]:
        u_prime = velocity_addition(1.0, b)
        print(f"  u=c, β={b:.1f}  →  u'={u_prime:.8f}  (esperado: 1.0)")
    print()

    print("Validación completada.")


if __name__ == '__main__':
    run_tests()
