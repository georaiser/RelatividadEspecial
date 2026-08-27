/**
 * lorentz.js — Motor físico: Transformaciones de Lorentz
 *
 * Proporciona las funciones matemáticas fundamentales de la
 * relatividad especial. No depende del DOM ni de ninguna biblioteca.
 * Puede usarse en cualquier panel y validarse con Python de forma independiente.
 */

const Lorentz = (() => {

  const C = 1; // velocidad de la luz normalizada (unidades naturales)

  /**
   * Factor de Lorentz γ para una velocidad β = v/c ∈ [0, 1).
   * @param {number} beta — velocidad relativa v/c
   * @returns {number} γ = 1 / √(1 − β²)
   */
  function gamma(beta) {
    if (beta < 0 || beta >= 1) {
      throw new RangeError(`beta debe estar en [0, 1). Se recibió: ${beta}`);
    }
    return 1 / Math.sqrt(1 - beta * beta);
  }

  /**
   * Transforma las coordenadas de un evento (x, t) del sistema S
   * al sistema S' que se mueve con velocidad v = β·c respecto a S.
   * Se asume que los orígenes coinciden en t = t' = 0.
   *
   * x' = γ (x − βct)
   * t' = γ (t − βx/c)
   *
   * En unidades naturales (c = 1):
   *   x' = γ (x − β t)
   *   t' = γ (t − β x)
   *
   * @param {number} x   — posición en S
   * @param {number} t   — tiempo en S
   * @param {number} beta — velocidad relativa v/c
   * @returns {{ x: number, t: number }} coordenadas en S'
   */
  function transform(x, t, beta) {
    const g = gamma(beta);
    return {
      x: g * (x - beta * t),
      t: g * (t - beta * x),
    };
  }

  /**
   * Transforma inversamente de S' a S.
   * @param {number} xp  — posición en S'
   * @param {number} tp  — tiempo en S'
   * @param {number} beta — velocidad relativa v/c
   * @returns {{ x: number, t: number }} coordenadas en S
   */
  function inverseTransform(xp, tp, beta) {
    return transform(xp, tp, -beta);
  }

  /**
   * Intervalo espacio-temporal entre dos eventos.
   * Δs² = Δt² − Δx²  (signatura +−, c = 1)
   * El intervalo es invariante bajo transformaciones de Lorentz.
   *
   * @param {number} dx — diferencia espacial
   * @param {number} dt — diferencia temporal
   * @returns {number} Δs²
   */
  function spacetimeInterval(dx, dt) {
    return dt * dt - dx * dx;
  }

  /**
   * Clasifica la separación entre dos eventos.
   * @param {number} ds2 — Δs² del intervalo
   * @returns {'temporal'|'luz'|'espacial'} tipo causal
   */
  function classifyInterval(ds2) {
    const EPS = 1e-10;
    if (Math.abs(ds2) < EPS) return 'luz';
    return ds2 > 0 ? 'temporal' : 'espacial';
  }

  /**
   * Suma relativista de velocidades.
   * u' = (u − v) / (1 − u·v/c²)
   * En unidades naturales (c = 1): u' = (u − β) / (1 − u·β)
   *
   * @param {number} u    — velocidad del objeto en S (en unidades de c)
   * @param {number} beta — velocidad de S' respecto a S
   * @returns {number} velocidad del objeto en S'
   */
  function addVelocities(u, beta) {
    return (u - beta) / (1 - u * beta);
  }

  return {
    gamma,
    transform,
    inverseTransform,
    spacetimeInterval,
    classifyInterval,
    addVelocities,
    C,
  };

})();

// Exporta para entornos Node.js (validación Python/JS independiente)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Lorentz;
}
