let controlesActivos = true;

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
        for (let i = 0; i < 10; i++) {
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
                    const soulAudio = new Audio("sounds/Fireball 2.wav");
                    soulAudio.play();
                    if (this.monedas.length == 0) {
                        controlesActivos = false;
                        mostrarMensajeEnJuego("You have summoned me. Your reward is to die first, I'll spare you the suffering of living under my reign of terror.", () => {
                            crearExplosionSobrePersonaje();
                            this.personaje.animacionMuerte();
                            setTimeout(() => {
                                const personaje = document.querySelector(".personaje");
                                const demonio = document.getElementById("big-demon");

                                personaje.style.display = "none";
                                demonio.style.display = "none";

                                const contenedor = document.getElementById("game-container");
                                contenedor.classList.add("endscreen");

                                mostrarMensajeEnJuego(
                                    "Congratulations!<br><br>You died as a fool, but you got 100 points.<br><br>Press SPACE to do it again.",
                                    () => location.reload()
                                );
                            }, 1000);
                        });
                        const demonElement = document.getElementById("big-demon");
                        demonElement.classList.remove("oculto");

                        let demonFrame = 0;
                        const demonTotalFrames = 4;
                        const demonFrameWidth = 324;
                        setInterval(() => {
                            demonElement.style.backgroundPosition = `-${demonFrame * demonFrameWidth}px 0`;
                            demonFrame = (demonFrame + 1) % demonTotalFrames;
                        }, 200);
                    }
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
        this.x = -20;
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
            },
            muerte: {
                url: 'url("Wizard/Sprites/Death.png")',
                frames: 5,
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
        this.animacionInterval = setInterval(() => {
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
        // Para detenerse si hay una animación de muerte o diálogo
        if (!controlesActivos) {
            if (this.estado === "muerte") return
            else {
                this.cambiarSprite("idle");
                return;
            };
        }

        // Aceleración hacia izquierda o derecha
        if (teclas["ArrowRight"]) {
            this.vx += this.aceleracion;
            this.element.style.transform = "scaleX(1)"; // mirar a la derecha
        } else if (teclas["ArrowLeft"]) {
            this.vx -= this.aceleracion;
            this.element.style.transform = "scaleX(-1)"; // mirar a la izquierda
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

        if (this.estado !== "muerte") {
            if (!this.saltando) {
                this.cambiarSprite("idle");
            } else {
                this.cambiarSprite("saltar");
            }
        }

        this.actualizarPosicion();
    }
    animacionMuerte() {
        this.vx = 0;
        this.estado = "muerte";
        controlesActivos = false;

        if (this.animacionInterval) {
            clearInterval(this.animacionInterval);
            this.animacionInterval = null;
        }

        const sprite = this.spriteData["muerte"];

        // Precargar imagen
        const img = new Image();
        const spriteURL = sprite.url.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
        img.src = spriteURL;

        img.onload = () => {
            this.element.style.backgroundImage = sprite.url;
            this.numFrames = sprite.frames;
            this.frameWidth = sprite.frameWidth;
            this.frame = 0;

            // Mostrar el primer frame (0) correctamente
            this.element.style.backgroundPosition = `0px 0`;

            // Iniciar animación después
            const interval = setInterval(() => {
                this.frame++;
                if (this.frame >= this.numFrames) {
                    clearInterval(interval);
                    this.frame = this.numFrames - 1;
                    return;
                }
                this.element.style.backgroundPosition = `-${this.frame * this.frameWidth}px 0`;
            }, 200);
        };
    }
}

class Moneda {
    constructor() {
        this.x = Math.random() * (726 - 180) + 180;
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

        this.element.src = `img/Effect1/${this.frame}.png`;

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

//Mensajes

function mostrarMensaje(texto) {
    return new Promise((resolve) => {
        const overlay = document.getElementById("mensaje-overlay");
        const textoElemento = document.getElementById("mensaje-texto");

        textoElemento.textContent = texto;
        overlay.classList.remove("oculto");

        function cerrarMensaje() {
            overlay.classList.add("oculto");
            window.removeEventListener("keydown", cerrarMensaje);
            resolve();
        }

        window.addEventListener("keydown", cerrarMensaje, { once: true });
    });
}

function mostrarMensajeEnJuego(texto, cuandoSeCierra) {
    controlesActivos = false;

    const mensaje = document.getElementById("mensaje-juego");
    const hablante = document.getElementById("hablante");

    mensaje.innerHTML = texto;
    mensaje.classList.remove("oculto");
    hablante.classList.remove("oculto");

    // Animación simple del personaje
    let frame = 0;
    const totalFrames = 4;
    const frameWidth = 162;
    const animacion = setInterval(() => {
        hablante.style.backgroundPosition = `-${frame * frameWidth}px 0`;
        frame = (frame + 1) % totalFrames;
    }, 200);

    // Solo cerrar con barra espaciadora
    function quitarMensaje(e) {
        if (e.code === "Space") {
            mensaje.classList.add("oculto");
            hablante.classList.add("oculto");
            clearInterval(animacion);
            window.removeEventListener("keydown", quitarMensaje);

            if (cuandoSeCierra) {
                cuandoSeCierra();
            } else {
                controlesActivos = true;
            }
        }
    }

    window.addEventListener("keydown", quitarMensaje);
}

let juego; //variable global

(async function () {
    await mostrarMensajeEnJuego(`I am the demon Haagenti. Pick all of my servants's fire souls to summon me. You'll be rewarded.<br><br>Each soul sigil gives you 10 points. Controls: arrow keys.<br><br>Press SPACE to start.`);
    juego = new Game();
})();

function crearExplosionSobrePersonaje() {
    const personaje = juego.personaje; // ← Esto solo funciona si `juego` está en scope global
    const explosion = document.createElement("div");
    explosion.classList.add("explosion");

    const frameWidth = 64;
    const totalFrames = 10;
    let frame = 0;

    // Posicionar centrado sobre el personaje
    const px = personaje.x + (personaje.width / 2) - (frameWidth / 2);
    const py = personaje.y + (personaje.height / 2) - (frameWidth / 2);
    explosion.style.left = `${px}px`;
    explosion.style.top = `${py}px`;

    document.getElementById("game-container").appendChild(explosion);
    const explosionAudio = new Audio("sounds/Firebuff 2.wav");
    explosionAudio.play();

    const interval = setInterval(() => {
        explosion.style.backgroundPosition = `-${frame * frameWidth}px 0`;
        frame++;
        if (frame >= totalFrames) {
            clearInterval(interval);
            explosion.remove(); // quitar la animación cuando termine
        }
    }, 100); // 10 FPS
}