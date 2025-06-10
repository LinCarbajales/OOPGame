class Game {
    constructor() {
        this.container = document.getElementById("game-container");
        this.personaje = null;
        this.monedas = [];
        this.puntuacion = 0;
        this.crearEscenario();
        this.agregarEventos();
        this.puntosElement = document.getElementById("puntos");
    };
    crearEscenario() {
        this.personaje = new Personaje();
        this.container.appendChild(this.personaje.element);
        for (let i = 0; i < 5; i++) {
            const moneda = new Moneda();
            this.monedas.push(moneda);
            this.container.appendChild(moneda.element);
        };
    };
    agregarEventos() {
        this.teclas = {};
        window.addEventListener("keydown", (e) => this.teclas[e.key] = true);
        window.addEventListener("keyup", (e) => this.teclas[e.key] = false);

        setInterval(() => {
            this.personaje.actualizarMovimiento(this.teclas);
        }, 16); // ~60 FPS

        this.checkColisiones();
    };
    checkColisiones() {
        setInterval(() => {
            this.monedas.forEach((moneda, index) => {
                if (this.personaje.colisionaCon(moneda)) {
                    this.container.removeChild(moneda.element);
                    this.monedas.splice(index, 1);
                    this.actualizarPuntuacion(10);
                }
            });
        }, 100);
    };
    actualizarPuntuacion(puntos) {
        this.puntuacion += puntos;
        this.puntosElement.textContent = `Puntos: ${this.puntuacion}`;
    }
}

class Personaje {
    constructor() {
        this.x = 50;
        this.y = 200;
        this.width = 300;
        this.height = 300;

        // Tamaño del cuadro de colisión
        this.hitboxWidth = 80;
        this.hitboxHeight = 120;

        // Offset para centrar la hitbox
        this.hitboxOffsetX = (this.width - this.hitboxWidth) / 2;
        this.hitboxOffsetY = (this.height - this.hitboxHeight) / 2;

        // Movimiento
        this.vx = 0;
        this.aceleracion = 1;
        this.maxVelocidad = 8;
        this.friccion = 0.9;
        this.saltando = false;
        this.element = document.createElement("div");
        this.element.classList.add("personaje");

        // Estado para cambiar sprite

        this.estado = "idle";
        this.spriteData = {
            idle: {
                url: 'url("Wizard/Sprites/Idle.png")',
                frames: 8,
                frameWidth: 300
            },
            saltar: {
                url: 'url("Wizard/Sprites/Move.png")',
                frames: 8,
                frameWidth: 300
            }
        };

        // Gráficos y animación
        this.element.style.backgroundImage = 'url("Wizard/Sprites/Idle.png")';
        this.element.style.backgroundRepeat = "no-repeat";

        this.frame = 0;
        this.numFrames = 8;
        this.frameWidth = 300;

        this.animar();

        this.actualizarPosicion();
    };

    animar() {
        setInterval(() => {
            this.frame = (this.frame + 1) % this.numFrames;
            this.element.style.backgroundPosition = `-${this.frame * this.frameWidth}px 0`;
        }, 200); // Cambia frame cada 200 ms
    };

    mover(evento) {
        if (evento.key === "ArrowRight") {
            this.x += this.vx;
        } else if (evento.key === "ArrowLeft") {
            this.x -= this.vx;
        } else if (evento.key === "ArrowUp") {
            this.saltar();
        }
        this.actualizarPosicion();
    };
    saltar() {
        this.saltando = true;
        let alturaMaxima = this.y - 250;
        const salto = setInterval(() => {
            if (this.y > alturaMaxima) {
                this.y -= 10;
            } else {
                clearInterval(salto);
                this.caer();
            }
            this.actualizarPosicion();
        }, 20);
    };

    caer() {
        const gravedad = setInterval(() => {
            if (this.y < 200) {
                this.y += 10;
                if (this.y > 200) this.y = 200; // que no pase del suelo
            } else {
                clearInterval(gravedad);
                this.saltando = false; // ← ya tocó el suelo
            }
            this.actualizarPosicion();
        }, 20);
    }

    cambiarSprite(estado) {
        if (this.estado !== estado) {
            this.estado = estado;

            const sprite = this.spriteData[estado];
            this.element.style.backgroundImage = sprite.url;
            this.numFrames = sprite.frames;
            this.frameWidth = sprite.frameWidth;
            this.frame = 0;
        }
    }

    actualizarPosicion() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    colisionaCon(objeto) {
        const hitboxX = this.x + this.hitboxOffsetX;
        const hitboxY = this.y + this.hitboxOffsetY;

        return (
            hitboxX < objeto.x + objeto.width &&
            hitboxX + this.hitboxWidth > objeto.x &&
            hitboxY < objeto.y + objeto.height &&
            hitboxY + this.hitboxHeight > objeto.y
        );
    }
    actualizarMovimiento(teclas) {
        // Aceleración hacia izquierda o derecha
        if (teclas["ArrowRight"]) {
            this.vx += this.aceleracion;
        } else if (teclas["ArrowLeft"]) {
            this.vx -= this.aceleracion;
        } else {
            // Aplicar fricción cuando no se pulsa nada
            this.vx *= this.friccion;
        }

        // Limitar velocidad máxima
        this.vx = Math.max(-this.maxVelocidad, Math.min(this.maxVelocidad, this.vx));

        // Actualizar posición
        this.x += this.vx;

        // Efecto wraparound
        const anchoEscenario = this.element.parentElement.offsetWidth;
        const margenVisible = 130;
        // Cuando el personaje se acerca al borde derecho
        if (this.x > anchoEscenario - margenVisible) {
            this.x = -this.width + margenVisible; // Empieza a asomar por la izquierda
        }
        // Cuando el personaje se acerca al borde izquierdo
        if (this.x < -this.width + margenVisible) {
            this.x = anchoEscenario - margenVisible; // Empieza a asomar por la derecha
        }

        // Cambiar el sprite al saltar

        if (teclas["ArrowUp"] && !this.saltando) {
            this.saltar();
        }

        if (!this.saltando) {
            this.cambiarSprite("idle");
        } else {
            this.cambiarSprite("saltar");
        };

        this.actualizarPosicion();
    }
}

class Moneda {
    constructor() {
        this.x = Math.random() * 700 + 50;
        this.y = Math.random() * 250 + 50;
        this.width = 64;
        this.height = 64;
        this.totalFrames = 60;
        this.frame = 0;

        // Usamos una imagen directamente
        this.element = document.createElement("img");
        this.element.width = this.width;
        this.element.height = this.height;
        this.element.classList.add("moneda");
        this.element.style.position = "absolute";
        this.actualizarPosicion();

        // Empezamos la animación
        this.animar();
    }

    actualizarPosicion() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    animar() {
        setInterval(() => {
            this.element.src = `img/Effect1/${this.frame}.png`;
            this.frame = (this.frame + 1) % this.totalFrames;
        }, 100); // 10 FPS
    }
}

const juego = new Game();