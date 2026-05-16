/**
 * OrbitControls - TypeScript port for React Native with touch gesture support
 * Simplified from three.js OrbitControls for mobile touch interaction
 */

import * as THREE from 'three';

interface SphericalPosition {
  radius: number;
  phi: number;
  theta: number;
}

export class OrbitControls {
  object: THREE.PerspectiveCamera;
  target: THREE.Vector3 = new THREE.Vector3();
  
  // Settings
  enabled: boolean = true;
  enableRotate: boolean = true;
  enableZoom: boolean = true;
  enablePan: boolean = true;
  
  rotateSpeed: number = 1.0;
  zoomSpeed: number = 1.0;
  panSpeed: number = 1.0;
  
  minDistance: number = 0;
  maxDistance: number = Infinity;
  minZoom: number = 0;
  maxZoom: number = Infinity;
  
  autoRotate: boolean = false;
  autoRotateSpeed: number = 2.0;
  private _autoRotateLastTime: number = 0;
  
  enableDamping: boolean = true;
  dampingFactor: number = 0.05;
  
  // Limits
  minPolarAngle: number = 0;      // Restored back to 0
  maxPolarAngle: number = Math.PI; // Restored back to Math.PI
  minAzimuthAngle: number = -Infinity;
  maxAzimuthAngle: number = Infinity;
  
  // Screen dimensions (set when first touch occurs)
  private screenWidth: number = 1;
  private screenHeight: number = 1;
  
  // Internal state
  private spherical = new THREE.Spherical();
  private sphericalDelta = new THREE.Spherical();
  private scale: number = 1;
  private panOffset = new THREE.Vector3();
  private zoomChanged: boolean = false;
  
  private rotateStart = new THREE.Vector2();
  private rotateEnd = new THREE.Vector2();
  private rotateDelta = new THREE.Vector2();
  
  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();
  private panDelta = new THREE.Vector2();
  
  private dollyStart = new THREE.Vector2();
  private dollyEnd = new THREE.Vector2();
  private dollyDelta = new THREE.Vector2();
  
  private state: 'none' | 'rotate' | 'zoom' | 'pan' = 'none';
  private changeEvent = { type: 'change' };
  
  // For state saving
  private target0 = new THREE.Vector3();
  private position0 = new THREE.Vector3();
  private zoom0: number = 1;
  
  constructor(object: THREE.PerspectiveCamera) {
    this.object = object;
    this.spherical.setFromVector3(this.object.position);
    this.target0.copy(this.target);
    this.position0.copy(this.object.position);
    this.zoom0 = this.object.zoom;
  }
  
  /**
   * Save the current state for reset
   */
  saveState(): void {
    this.target0.copy(this.target);
    this.position0.copy(this.object.position);
    this.zoom0 = this.object.zoom;
  }
  
  /**
   * Reset to saved state
   */
  reset(): void {
    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.object.zoom = this.zoom0;
    this.object.updateProjectionMatrix?.();
  }
  
  /**
   * Set the screen dimensions (width/height)
   * @param width Screen width in pixels
   * @param height Screen height in pixels
   */
  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }
  
  /**
   * Handle touch start event with N fingers
   */
  onTouchStart(touches: Touch[]): void {
    if (!this.enabled) return;
    
    switch (touches.length) {
      case 1:
        this.handleTouchStartRotate(touches);
        this.state = 'rotate';
        break;
      case 2:
        // Two fingers: zoom + pan
        this.handleTouchStartDolly(touches);
        this.handleTouchStartPan(touches);
        this.state = 'zoom';
        break;
      default:
        this.state = 'none';
    }
  }
  
  /**
   * Handle touch move event with N fingers
   */
  onTouchMove(touches: Touch[]): void {
    if (!this.enabled) return;
    
    // Smoothly transition if fingers are added mid-gesture in React Native
    if (touches.length === 2 && this.state !== 'zoom') {
      this.handleTouchStartDolly(touches);
      this.handleTouchStartPan(touches);
      this.state = 'zoom';
    } else if (touches.length === 1 && this.state !== 'rotate') {
      this.handleTouchStartRotate(touches);
      this.state = 'rotate';
    }
    
    switch (this.state) {
      case 'rotate':
        if (this.enableRotate && touches.length === 1) {
          this.handleTouchMoveRotate(touches);
        }
        break;
      case 'zoom':
        if (touches.length === 2) {
          if (this.enableZoom) this.handleTouchMoveDolly(touches);
          if (this.enablePan) this.handleTouchMovePan(touches);
        }
        break;
    }
    
    this.update();
  }
  
  /**
   * Handle touch end event
   */
  onTouchEnd(touches: Touch[]): void {
    if (!this.enabled) return;
    
    this.state = 'none';
    this.sphericalDelta.phi *= this.dampingFactor;
    this.sphericalDelta.theta *= this.dampingFactor;
  }
  
  /**
   * Update camera position based on controls state
   * Called in animation loop
   */
  update(): void {
    // Get difference vector from target to camera
    const offset = this.object.position.clone().sub(this.target);
    
    // Apply rotation deltas using Quaternions (Trackball rotation)
    if (this.enableRotate) {
      const eyeDir = offset.clone().normalize();
      const cameraUp = this.object.up.clone().normalize();
      // Calculate right vector based on current view
      const cameraRight = new THREE.Vector3().crossVectors(cameraUp, eyeDir).normalize();
      
      const axis = new THREE.Vector3();
      
      // Horizontal movement -> rotate around camera's UP vector
      axis.addScaledVector(cameraUp, this.sphericalDelta.theta);
      // Vertical movement -> rotate around camera's RIGHT vector
      axis.addScaledVector(cameraRight, this.sphericalDelta.phi);
      
      const angle = axis.length();
      if (angle > 0.0001) {
        axis.normalize();
        const quat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        
        // Rotate the camera position offset
        offset.applyQuaternion(quat);
        // Rotate the camera's up vector so it truly tumbling (no gimbal lock!)
        this.object.up.applyQuaternion(quat);
      }
    }
    
    // Clamp radius/zoom
    let radius = offset.length();
    radius *= this.scale;
    radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, radius)
    );
    if (radius > 0) {
      offset.normalize().multiplyScalar(radius);
    }
    
    // Apply damping
    if (this.enableDamping) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor;
      this.sphericalDelta.phi *= 1 - this.dampingFactor;
    } else {
      this.sphericalDelta.theta = 0;
      this.sphericalDelta.phi = 0;
    }

    // Auto-rotation: time-based so speed is identical regardless of frame rate
    if (this.autoRotate) {
      const now = Date.now();
      if (this._autoRotateLastTime > 0) {
        const dt = Math.min((now - this._autoRotateLastTime) / 1000, 0.1); // seconds, capped at 100ms
        const radiansPerSecond = (2 * Math.PI / 30) * this.autoRotateSpeed;
        this.sphericalDelta.theta -= radiansPerSecond * dt;
      }
      this._autoRotateLastTime = now;
    } else {
      this._autoRotateLastTime = 0;
    }

    this.scale = 1;

    // Apply position
    this.object.position.copy(this.target).add(offset);
    this.object.lookAt(this.target);
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    // Clean up if needed
  }
  
  // ─── Private rotate handlers ──────────────────────────────────────────────
  
  private handleTouchStartRotate(touches: Touch[]): void {
    this.rotateStart.set(touches[0].clientX, touches[0].clientY);
  }
  
  private handleTouchMoveRotate(touches: Touch[]): void {
    this.rotateEnd.set(touches[0].clientX, touches[0].clientY);
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed);
    
    // Convert pixel deltas to radians based on screen height, multiply by a sensitivity factor to slow it down
    const sensitivity = 0.15 * this.rotateSpeed; // Decreased from 0.5 to 0.15 to smoothly slow down rotation
    const deltaRotateUp =
      (2 * Math.PI * this.rotateDelta.y) / Math.max(this.screenHeight, 1) * sensitivity;
    const deltaRotateLeft =
      (2 * Math.PI * this.rotateDelta.x) / Math.max(this.screenHeight, 1) * sensitivity;
    
    this.sphericalDelta.phi -= deltaRotateUp;
    this.sphericalDelta.theta -= deltaRotateLeft;
    
    this.rotateStart.copy(this.rotateEnd);
  }
  
  // ─── Private zoom/dolly handlers ──────────────────────────────────────────
  
  private handleTouchStartDolly(touches: Touch[]): void {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.dollyStart.set(0, Math.max(distance, 1));
  }
  
  private handleTouchMoveDolly(touches: Touch[]): void {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.dollyEnd.set(0, Math.max(distance, 1)); // Prevent division by 0
    
    // Zoom out if fingers moving closer, in if moving apart
    // continuous pinch scaling using the ratio
    const zoomScale = this.dollyStart.y / this.dollyEnd.y;
    // apply an overall dampening/speed factor if needed
    this.scale *= Math.pow(zoomScale, this.zoomSpeed);
    
    this.dollyStart.copy(this.dollyEnd);
  }
  
  // ─── Private pan handlers ─────────────────────────────────────────────────
  
  private handleTouchStartPan(touches: Touch[]): void {
    if (touches.length === 2) {
      const x = 0.5 * (touches[0].clientX + touches[1].clientX);
      const y = 0.5 * (touches[0].clientY + touches[1].clientY);
      this.panStart.set(x, y);
    } else {
      this.panStart.set(touches[0].clientX, touches[0].clientY);
    }
  }
  
  private handleTouchMovePan(touches: Touch[]): void {
    if (touches.length === 2) {
      const x = 0.5 * (touches[0].clientX + touches[1].clientX);
      const y = 0.5 * (touches[0].clientY + touches[1].clientY);
      this.panEnd.set(x, y);
    } else {
      this.panEnd.set(touches[0].clientX, touches[0].clientY);
    }
    
    this.panDelta
      .subVectors(this.panEnd, this.panStart)
      .multiplyScalar(this.panSpeed);
    
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
  }
  
  /**
   * Pan the camera in screen space
   */
  private pan(deltaX: number, deltaY: number): void {
    const distance = this.object.position.distanceTo(this.target);
    
    // Pan in world space relative to camera direction
    const forward = new THREE.Vector3();
    this.object.getWorldDirection(forward);
    
    const up = this.object.up.clone();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    up.crossVectors(right, forward).normalize();
    
    const panVector = new THREE.Vector3();
    panVector.addScaledVector(right, -deltaX * 0.01);
    panVector.addScaledVector(up, deltaY * 0.01);
    
    this.target.add(panVector);
    this.panOffset.add(panVector);
  }
}
