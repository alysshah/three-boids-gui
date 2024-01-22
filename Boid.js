import * as THREE from "three";

class Boid {
  constructor(x, y, z, boxWidth, boxHeight, boxDepth, confinementMode) {
    this.boxWidth = boxWidth;
    this.boxHeight = boxHeight;
    this.boxDepth = boxDepth;
    this.confinementMode = confinementMode;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    this.maxSpeed = 3;
    this.maxForce = 0.2;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([x, y, z], 3) // change the 3 to a 2 to make it 2d
    );

    const material = new THREE.PointsMaterial({ color: 0x0000ff, size: 4 });
    this.point = new THREE.Points(geometry, material);
  }

  getMesh() {
    return this.point;
  }

  update(flock, confinementMode, col, cohMult, sepMult, aliMult) {
    // Apply forces
    let v1 = this.cohesion(cohMult, 50, flock, this.maxSpeed, this.maxForce);
    let v2 = this.separation(sepMult, 25, flock, this.maxSpeed, this.maxForce);
    let v3 = this.alignment(aliMult, 50, flock, this.maxSpeed, this.maxForce);

    this.velocity.add(v1);
    this.velocity.add(v2);
    this.velocity.add(v3);

    // Handle confinement
    if (confinementMode == 0) {
      this.checkEdges(this.boxWidth, this.boxHeight, this.boxDepth);
    } else if (confinementMode == 1) {
      this.wrap(this.boxWidth, this.boxHeight, this.boxDepth);
    } else if (confinementMode == 2) {
      let b = this.bound(this.boxWidth, this.boxHeight, this.boxDepth, 1.5);
      this.velocity.add(b);
    }

    // Limit and add velocity
    this.limitVelocity(1);
    this.position.add(this.velocity);

    // Update position
    this.point.geometry.attributes.position.setXYZ(
      0,
      this.position.x,
      this.position.y,
      this.position.z
    );
    this.point.geometry.attributes.position.needsUpdate = true;

    // Update color
    this.point.material.color = new THREE.Color(col);
  }

  // Rule 1: Boids try to fly towards the centre of mass of neighbouring boids.
  cohesion(coef, range, flock, maxSpeed, maxForce) {
    let pcJ = new THREE.Vector3(0, 0, 0);
    let count = 0;

    flock.forEach((boid) => {
      if (boid !== this) {
        let d = this.position.distanceTo(boid.position);
        if (d > 0 && d < range) {
          pcJ.add(boid.position);
          count++;
        }
      }
    });

    if (count > 0) {
      pcJ.divideScalar(count);
      let desired = pcJ.sub(this.position).normalize().multiplyScalar(maxSpeed);
      let steer = desired.sub(this.velocity).clampLength(0, maxForce);
      return steer.multiplyScalar(coef);
    }

    return new THREE.Vector3(0, 0, 0);
  }

  // Rule 2: Boids try to keep a small distance away from other objects (including other boids).
  separation(coef, range, flock, maxSpeed, maxForce) {
    let steer = new THREE.Vector3(0, 0, 0);
    let count = 0;

    flock.forEach((boid) => {
      let d = this.position.distanceTo(boid.position);
      if (d > 0 && d < range) {
        let diff = this.position
          .clone()
          .sub(boid.position)
          .normalize()
          .divideScalar(d);
        steer.add(diff);
        count++;
      }
    });

    if (count > 0) {
      steer.divideScalar(count);
      let desired = steer.normalize().multiplyScalar(maxSpeed);
      steer = desired.sub(this.velocity).clampLength(0, maxForce);
    }

    return steer.multiplyScalar(coef);
  }

  // Rule 3: Boids try to match velocity with near boids.
  alignment(coef, range, flock, maxSpeed, maxForce) {
    let sum = new THREE.Vector3(0, 0, 0);
    let count = 0;

    flock.forEach((boid) => {
      let d = this.position.distanceTo(boid.position);
      if (d > 0 && d < range) {
        sum.add(boid.velocity);
        count++;
      }
    });

    if (count > 0) {
      sum.divideScalar(count);
      let desired = sum.normalize().multiplyScalar(maxSpeed);
      let steer = desired.sub(this.velocity).clampLength(0, maxForce);
      return steer.multiplyScalar(coef);
    }

    return new THREE.Vector3(0, 0, 0);
  }

  limitVelocity(maxVelocity) {
    if (this.velocity.length() > maxVelocity) {
      this.velocity.normalize().multiplyScalar(maxVelocity);
    }
  }

  // Confinement Mode 0
  checkEdges(boxWidth, boxHeight, boxDepth) {
    if (this.position.x >= boxWidth / 2 || this.position.x <= -boxWidth / 2) {
      this.velocity.x = -this.velocity.x;
    }
    if (this.position.y >= boxHeight / 2 || this.position.y <= -boxHeight / 2) {
      this.velocity.y = -this.velocity.y;
    }
    if (this.position.z >= boxDepth / 2 || this.position.z <= -boxDepth / 2) {
      this.velocity.z = -this.velocity.z;
    }
  }

  // Confinement Mode 1
  wrap(boxWidth, boxHeight, boxDepth) {
    if (this.position.x < -boxWidth / 2) this.position.x = boxWidth / 2;
    if (this.position.y < -boxHeight / 2) this.position.y = boxHeight / 2;
    if (this.position.z < -boxDepth / 2) this.position.z = boxDepth / 2;
    if (this.position.x > boxWidth / 2) this.position.x = -boxWidth / 2;
    if (this.position.y > boxHeight / 2) this.position.y = -boxHeight / 2;
    if (this.position.z > boxDepth / 2) this.position.z = -boxDepth / 2;
  }

  // Confinement Mode 2
  bound(boxWidth, boxHeight, boxDepth, factor) {
    let v = new THREE.Vector3(0, 0, 0);

    if (this.position.x < -boxWidth / 2) {
      v.x = factor;
    } else if (this.position.x > boxWidth / 2) {
      v.x = -factor;
    }

    if (this.position.y < -boxHeight / 2) {
      v.y = factor;
    } else if (this.position.y > boxHeight / 2) {
      v.y = -factor;
    }

    if (this.position.z < -boxDepth / 2) {
      v.z = factor;
    } else if (this.position.z > boxDepth / 2) {
      v.z = -factor;
    }
    return v;
  }

  // Handle changes in confinement space
  setBoxSize(newWidth, newHeight, newDepth) {
    this.boxWidth = newWidth;
    this.boxHeight = newHeight;
    this.boxDepth = newDepth;
  }
}

export default Boid;
