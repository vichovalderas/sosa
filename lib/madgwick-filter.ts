"use client"

export class MadgwickFilter {
  private q0 = 1.0 // w
  private q1 = 0.0 // x
  private q2 = 0.0 // y
  private q3 = 0.0 // z
  private beta: number
  private sampleFreq: number

  constructor(beta = 0.1, sampleFreq = 50) {
    this.beta = beta
    this.sampleFreq = sampleFreq
  }

  update(gx: number, gy: number, gz: number, ax: number, ay: number, az: number) {
    const dt = 1.0 / this.sampleFreq

    // Normalizar acelerómetro
    const norm = Math.sqrt(ax * ax + ay * ay + az * az)
    if (norm === 0) return

    ax /= norm
    ay /= norm
    az /= norm

    // Gradiente de la función objetivo
    const f1 = 2 * (this.q1 * this.q3 - this.q0 * this.q2) - ax
    const f2 = 2 * (this.q0 * this.q1 + this.q2 * this.q3) - ay
    const f3 = 2 * (0.5 - this.q1 * this.q1 - this.q2 * this.q2) - az

    // Jacobiano
    const j11 = -2 * this.q2
    const j12 = 2 * this.q3
    const j13 = -2 * this.q0
    const j14 = 2 * this.q1
    const j21 = 2 * this.q1
    const j22 = 2 * this.q0
    const j23 = 2 * this.q3
    const j24 = 2 * this.q2
    const j31 = 0
    const j32 = -4 * this.q1
    const j33 = -4 * this.q2
    const j34 = 0

    // Gradiente
    let step0 = j11 * f1 + j21 * f2 + j31 * f3
    let step1 = j12 * f1 + j22 * f2 + j32 * f3
    let step2 = j13 * f1 + j23 * f2 + j33 * f3
    let step3 = j14 * f1 + j24 * f2 + j34 * f3

    // Normalizar gradiente
    const stepNorm = Math.sqrt(step0 * step0 + step1 * step1 + step2 * step2 + step3 * step3)
    if (stepNorm !== 0) {
      step0 /= stepNorm
      step1 /= stepNorm
      step2 /= stepNorm
      step3 /= stepNorm
    }

    // Derivada del cuaternión
    const qDot0 = 0.5 * (-this.q1 * gx - this.q2 * gy - this.q3 * gz) - this.beta * step0
    const qDot1 = 0.5 * (this.q0 * gx + this.q2 * gz - this.q3 * gy) - this.beta * step1
    const qDot2 = 0.5 * (this.q0 * gy - this.q1 * gz + this.q3 * gx) - this.beta * step2
    const qDot3 = 0.5 * (this.q0 * gz + this.q1 * gy - this.q2 * gx) - this.beta * step3

    // Integrar
    this.q0 += qDot0 * dt
    this.q1 += qDot1 * dt
    this.q2 += qDot2 * dt
    this.q3 += qDot3 * dt

    // Normalizar cuaternión
    const qNorm = Math.sqrt(this.q0 * this.q0 + this.q1 * this.q1 + this.q2 * this.q2 + this.q3 * this.q3)
    this.q0 /= qNorm
    this.q1 /= qNorm
    this.q2 /= qNorm
    this.q3 /= qNorm
  }

  getQuaternion() {
    return {
      w: this.q0,
      x: this.q1,
      y: this.q2,
      z: this.q3,
    }
  }

  reset() {
    this.q0 = 1.0
    this.q1 = 0.0
    this.q2 = 0.0
    this.q3 = 0.0
  }
}
