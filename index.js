let DEV = false;

const FALSE_POSITIVE = 100;
const FALSE_NEGATIVE = 200;

const FALSE_NEGATIVE_SENTENCES = [
    "That one was fake",
    "That didn't happen",
    "Nope, that was fake",
    "That didn't happen",
    "Could've happened"
];

const FALSE_POSITIVE_SENTENCES = [
    "That really happend",
    "Yea, that was real",
    "Nope, that was real",
    "That one was real",
    "Uhh, that actually happened"
];


class Card {
    constructor(headline_json, count, settings) {
        this.title = headline_json.text;
        this.is_real = headline_json.is_real;
        this.id = headline_json.id;

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
                        <!--<p class="card-count">${this.count}/10</p>-->
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
            // console.log(opacity);
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
            this.set_progress(direction * 3);
            setTimeout(() => {
                this.div.classList.add("hide");
            }, 1000);
            if (this.stack) {
                this.stack.next();
            }

            this.gone = true;

            if (direction < 0)
                this.left();
            else
                this.right();
        }
    }

    // Opinion Real
    left() {
        if(this.is_real) {
            delete_progress(FALSE_POSITIVE);

            submit_answer(this.id, false);
        } else {
            add_progress();
            submit_answer(this.id, true);
        }
    }

    // Opinion Fake
    right() {
        if(!this.is_real) {
            delete_progress(FALSE_NEGATIVE);

            submit_answer(this.id, false);
        } else {
            add_progress();
            submit_answer(this.id, true);
        }
    }
}

function submit_answer(id, was_correct) {
    if(!DEV) {
        return fetch("https://fakeornot.menzinger.workers.dev", {
            method: "post",
            body: JSON.stringify({
                "id": id, 
                "correct": was_correct
            })
        });
    }else {
        console.log("process not submitted - dev mode")
    }
}

function add_progress(percent_to_add = 10) {
    let progress = document.querySelector(".progress");
    let count = document.querySelector(".count");
    let progressbar = document.querySelector(".progressbar");
    let container = document.querySelector("#container-streak");

    if (progress.percent == null)
        progress.percent = 0;

    old_progress = progress.percent
    new_progress = progress.percent + percent_to_add;
    progress.percent = new_progress;

    // console.log(old_progress, new_progress)

    if (old_progress < 90 && new_progress >= 90)
        animate(container, "shake-bottom3");

    if (old_progress < 80 && new_progress >= 80)
        animate(container, "shake-bottom2");

    if (old_progress < 70 && new_progress >= 70)
        animate(container, "shake-bottom1");

    if (old_progress < 110 && new_progress >= 110) {
        container.classList.add("max", "max-1");
        animate(container, "shake-bottom1");
    } else if (old_progress < 150 && new_progress >= 150) {
        container.classList.add("max", "max-2");
        animate(container, "shake-bottom2");
    } else if (old_progress < 200 && new_progress >= 200) {
        container.classList.add("max", "max-3");
        animate(container, "shake-bottom3");
    } else if (old_progress < 250 && new_progress >= 250) {
        container.classList.add("max", "max-4");
        animate(container, "shake-bottom3");
    } else if (new_progress > 100) {
        animate(container, "shake-bottom1");
    }

    progress.style.width = (progress.percent >= 100 ? 100 : progress.percent) + "%";

    count.textContent = new_progress / percent_to_add;
    animate(count, "highlight");

}

function animate(element, animation_class, time = 500) {
    element.classList.add(animation_class)
    setTimeout(() => {
        element.classList.remove(animation_class)
    }, time);
}

function delete_progress(type) {


    if(type) {
        let text;

        if(type == FALSE_NEGATIVE)
            text = FALSE_NEGATIVE_SENTENCES[Math.floor(Math.random()*FALSE_NEGATIVE_SENTENCES.length)];
        else
            text = FALSE_POSITIVE_SENTENCES[Math.floor(Math.random()*FALSE_POSITIVE_SENTENCES.length)];

        let flyin = document.getElementById("flyin");
        let flyin_text = flyin.querySelector("#flyin-text");
        flyin_text.textContent = text;

        flyin.style.transform = `rotate(${(Math.random()-0.5)*30}deg)`;

        animate(flyin, "fly", 1000);
    } 

    let progress = document.querySelector(".progress");
    let progressbar = document.querySelector(".progressbar");
    let container = document.querySelector("#container-streak");
    let count = document.querySelector(".count");

    container.classList.remove("max");
    container.classList.remove("max-1");
    container.classList.remove("max-2");
    container.classList.remove("max-3");
    container.classList.remove("max-4");

    animate(progressbar, "bounce-right");

    progress.percent = 0;
    progress.style.width = progress.percent + "%";

    count.textContent = "";
}

async function confetti_rain(color = "red", amount = 150) {
    let celebration_container = document.getElementById("celebration_container");
    let confetti = [];
    for (let x = 0; x < amount; x++) {
        let c = document.createElement("div")
        c.classList.add("confetti")

        c.style.opacity = 0.8;

        let height = 5 + 20 * Math.random()

        c.style.height = `${5+5*Math.random()}px`;
        c.style.width = `${50 / height}px`;
        // c.style.backgroundColor = `rgb(${255*Math.random()}, ${255*Math.random()}, ${255*Math.random()})`;
        c.style.backgroundColor = color;
        c.style.top = -10 + "px";
        c.style.left = 10 + screen.width * Math.random() * 0.92 + "px";

        let drop = (1 + Math.random() * 2) / 1.5;
        let start = 2 * Math.random();
        let offset = 0.75;
        c.style.transition = `all ${drop}s linear ${start}s, opacity linear ${drop-offset}s ${start}s`;

        celebration_container.appendChild(c)
        confetti.push(c);
    }

    for (let c of confetti) {
        setTimeout(() => {
            c.style.transform = `translateY(${screen.height/4 + Math.random() * screen.height}px) rotate(${(Math.random()-0.5)*180}deg)`;
            c.style.opacity = 0;
        }, 10);
    }

    setTimeout(() => {
        console.log(confetti.length)
        for (let c of confetti) {
            c.remove();
        }
    }, 3000);
}

class Stack {
    constructor(cards, empty_callback) {
        this.cards = cards;
        for (let card of cards) {
            card.stack = this;
        }

        this.empty_callback = empty_callback;

        this.index = this.cards.length - 1;
        this.current = this.cards[this.index];
    }

    add_to_container() {
        let container = document.querySelector("#container-headlines");
        for (let card of this.cards) {
            container.appendChild(card.div);
        }
    }

    async show_all() {
        for (let card of this.cards) {
            await sleep(75 + Math.random() * 50);
            card.show()
        }
        this.current.activate();
    }

    next() {
        this.index = this.index - 1;
        if (this.index >= 0) {
            this.current = this.cards[this.index];
            this.current.activate();
        } else {
            this.empty_callback();
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


function headlines_to_cards(headlines) {
    let cards = []
    for (let i = 0; i < 10; i++) {
        cards.push(new Card(headlines[i], headlines.length - i));
    }
    return cards
}

function get_new_headlines() {
    return fetch("https://get-headlines.fake-or-not.workers.dev/").then(response => response.json());
}

async function play(empty_callback = play) {
    let cards = headlines_to_cards(await get_new_headlines());
    let stack = new Stack(cards, empty_callback = empty_callback);
    stack.add_to_container();
    stack.show_all();
}

async function init() {
    const queryParams = new URLSearchParams(window.location.search);
    const difficulty = queryParams.get('difficulty');

    play()
}
