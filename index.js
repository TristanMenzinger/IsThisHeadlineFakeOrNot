class Card {
    constructor(title, count, settings) {
        this.title = title;
        this.count = count;

        this._create_div();

        this.overlay_left = this.div.querySelector(".overlay-left");
        this.overlay_right = this.div.querySelector(".overlay-right");

        settings = settings ? settings : {};
        this.threshold_go = settings["threshold_go"] ? settings["threshold_go"] : 0.4;
        this.overlay_multiplier = settings["overlay_multiplier"] ? settings["overlay_multiplier"] : 2;
        this.fade_multiplier = settings["fade_multiplier"] ? settings["fade_multiplier"] : 0.5;

        this.initial_rotation = (Math.random() - 0.5) * 5;
        this.initial_x_offset = (Math.random() - 0.5) * 5;
        this.initial_y_offset = (Math.random() - 0.5) * 5;

        // Hide out of view by default
        this.div.style.transform = `translateX(${screen.width+Math.random()*200}px) translateY(${(Math.random()-0.5)*screen.height/3}px) translateZ(1000px) rotate(${(Math.random()-0.5)*20}deg) rotateX(40deg) rotateY(30deg)`;

        this.gone = false;;

    }

    _create_div() {
        let template = `
                <div class="card swipe-card headline">
                    <div class="swipe-card overlay overlay-left"><span>Fake</span></div>
                    <div class="swipe-card overlay overlay-right"><span>Real</span></div>
                    <div class="card-body">
                        <div class="card-info">
                            <p class="card-count">${this.count}/10</p>
                            <!--  <p class="card-difficulty"><span style="color: ${this.difficulty === "Easy" ? '#28a745' : this.difficulty === "Medium" ? '#ffc107' : '#dc3545'}">${this.difficulty}</span></p>  -->
                        </div>
                        <!-- <h5 class="card-title">Special title treatment</h5> -->
                        <p class="card-text">${this.title}</p>
                    </div>
                </div>`;
        this.div = div_from_template(template);
    }

    show() {
        this.div.classList.add("smooth");
        this.div.style.transform = `translateX(${this.initial_x_offset}px) translateY(${this.initial_y_offset}px) rotate(${this.initial_rotation}deg)`;
    }

    activate() {

        this.div.ontouchstart = (event) => {
            this.div.classList.remove("smooth");
            this.start_x = event.touches[0].clientX;
            this.start_y = event.touches[0].clientY;
            this.width = this.div.getBoundingClientRect().width;
        }
        this.div.ontouchmove = (event) => {
            const percentage_progress = (event.touches[0].clientX - this.start_x) / this.width;
            this.set_progress(percentage_progress);
        }
        this.div.ontouchend = (event) => {
            const percentage_progress = (event.changedTouches[0].clientX - this.start_x) / this.width;
            if (Math.abs(percentage_progress) > this.threshold_go) {
                this.go(percentage_progress / Math.abs(percentage_progress));
            } else {
                this.comeback();
            }
        }

        let drag = false;
        this.div.onmousedown = (event) => {
            drag = true;
            this.div.classList.remove("smooth");
            this.start_x = event.clientX;
            this.start_y = event.clientY;
            this.width = this.div.getBoundingClientRect().width;
        }
        this.div.onmousemove = (event) => {
            if (drag) {
                const percentage_progress = (event.clientX - this.start_x) / this.width;
                this.set_progress(percentage_progress);
            }
        }
        this.div.onmouseup = (event) => {
            drag = false;

            const percentage_progress = (event.clientX - this.start_x) / this.width;
            if (Math.abs(percentage_progress) > this.threshold_go) {
                this.go(percentage_progress / Math.abs(percentage_progress));
            } else {
                this.comeback();
            }
        }
    }

    deactivate() {
        this.div.ontouchstart = () => {}
        this.div.ontouchmove = () => {}
        this.div.ontouchend = () => {}
    }

    set_progress(percentage_progress) {
        if (!this.gone) {
            const x_transform = this.initial_x_offset + percentage_progress * this.width;
            const rotation = this.initial_rotation + 10 * percentage_progress;

            this.div.style.opacity = 1 - sigmoid((Math.abs(this.fade_multiplier * percentage_progress) - 0.75) * 10);
            this.div.style.transform = `translateX(${x_transform}px) translateY(${this.initial_y_offset}px) rotate(${rotation}deg)`;

            const opacity = sigmoid((Math.abs(this.overlay_multiplier * percentage_progress) - 0.5) * 5);
            console.log(opacity);
            if (percentage_progress < 0) {
                this.overlay_left.style.opacity = opacity;
            } else {
                this.overlay_right.style.opacity = opacity;
            }
        }
    }

    comeback() {
        this.div.classList.add("smooth");

        this.overlay_left.style.opacity = 0;
        this.overlay_right.style.opacity = 0;

        this.div.style.opacity = 1;
        this.div.style.transform = `translateX(${this.initial_x_offset}px) translateY(${this.initial_y_offset}px) rotate(${this.initial_rotation}deg)`;
    }

    go(direction) {
        if (!this.gone) {
            this.div.classList.add("smooth");
            this.set_progress(direction * 2);
            setTimeout(() => {
                this.div.classList.add("hide");
            }, 1000);
            if (this.stack) {
                this.stack.next();
            }

            this.gone = true;

            if (direction < 0)
                this.right();
            else
                this.left();
        }
    }

    right() {
        console.log("make it rain");
        setTimeout(function() {
            confetti_rain("red");
        }, 10)
    }
    left() {
        console.log("make it rain");
        setTimeout(function() {
            confetti_rain("green");
        }, 10)
    }
}

class Stack {
    constructor(cards) {
        this.cards = cards;
        for (let card of cards) {
            card.stack = this;
        }

        this.index = this.cards.length - 1;
        this.current = this.cards[this.index];
        this.current.activate();
    }

    async show_all() {
        for (let card of this.cards) {
            await sleep(75 + Math.random() * 50);
            card.show()
        }
    }

    next() {
        this.index = this.index - 1;
        if (this.index >= 0) {
            this.current = this.cards[this.index];
            console.log(this.index);
            this.current.activate();
        } else {
            setTimeout(() => {
                document.getElementById('container-wrapper').style.zIndex = '-100';
            }, 300);
        }
    }
}

let div_from_template = (filled_template_string) => {
    let wrapper = document.createElement("div");
    wrapper.innerHTML = filled_template_string;
    return wrapper.firstElementChild;
}

function sigmoid(t) {
    return 1 / (1 + Math.exp(-t));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function show_headlines(headlines) {

    let cards = []
    for (let i = 0; i < 10; i++) {
        cards.push(new Card(headlines[i], 10 - i));
    }

    container = document.querySelector("#container-headlines");
    for (let card of cards) {
        container.appendChild(card.div);
    }
    let stack = new Stack(cards);

    document.getElementById('container-wrapper').style.zIndex = '100';
    stack.show_all();
    document.getElementById('container-wrapper').style.display = 'flex';

    // setTimeout(function() {
    document.getElementById('info-done').style.display = 'flex';
    // }, 3000);
}

function init() {
    const queryParams = new URLSearchParams(window.location.search);
    const difficulty = queryParams.get('difficulty');

    if (difficulty) {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const headlines = JSON.parse(this.responseText);
                show_headlines(headlines);
            }
        };
        xhttp.open("POST", "https://get-headlines.fake-or-not.workers.dev");
        xhttp.send();
    } else {
        document.getElementById('difficulty').style.display = 'flex';
    }
}