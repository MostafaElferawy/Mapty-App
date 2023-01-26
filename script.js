
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(distance, duration, coords) {
    this.distance = distance; //km
    this.duration = duration; //min
    this.coords = coords; //[lat, lng]
  }
  _setDiscription() {
    // prettier-ignore
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);

    // this.type = 'running'
    this.cadence = cadence;
    this.clacPace();
    this._setDiscription();
  }

  clacPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._setDiscription();
  }

  clacSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const running1 = new Running(50, 120, [15, -30], 194);
// const cycling1 = new Cycling(140, 90, [15, -20], 451);
// console.log(running1, cycling1);

//////////////////////////////////////
// APPLICATION ARCHITECTURE


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workoutsArr = [];
  constructor() {
    this._getPosition();

    this._getLocalStorge();

    inputType.addEventListener('change', this._toggelElvationFeild.bind(this));
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._jumpToWorout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    // console.log(postion);
    const latitude = position.coords.latitude;
    const { longitude } = position.coords;

    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    // NOTE: parmater ('map') is the id of div that show map
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handeling click on map
    this.#map.on('click', this._showForm.bind(this));

    // show markers on the map
    this.#workoutsArr.forEach(work => {
      this._randerWorkoutmarker(work);
    });
  }

  _showForm(event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputType.value =
      inputDistance.value =
      inputDuration.value =
      inputCadence.value =
        '';
    form.classList.add('hidden');
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggelElvationFeild() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const isNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const elevation = +inputElevation.value;
    const cadence = +inputCadence.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !isNumber(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      if (
        !isNumber(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    // add  object to workout array
    this.#workoutsArr.push(workout);
    console.log(workout);

    //Render workout on map
    this._randerWorkoutmarker(workout);

    //Render workout in list
    this._renderWorkoutInList(workout);

    // hide form and clear inputs
    this._hideForm();

    //storge all workouts in localstrorge
    this._setLocalStorge();
  }

  _randerWorkoutmarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  _renderWorkoutInList(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id=${
      workout.id
    }>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
         `;

    if (workout.type === 'running')
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _jumpToWorout(e) {
    const workoutEle = e.target.closest('.workout');

    // Gurde function
    if (!workoutEle) return;

    const targtWorkout = this.#workoutsArr.find(
      work => work.id === workoutEle.dataset.id
    );
    console.log(targtWorkout);

    this.#map.setView(targtWorkout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorge() {
    localStorage.setItem('workoutArr', JSON.stringify(this.#workoutsArr));
  }

  _getLocalStorge() {
    const storedData = JSON.parse(localStorage.getItem('workoutArr'));

    // console.log(storedData);

    // Gurde function
    if (!storedData) return;

    storedData.forEach(work => {
      this._renderWorkoutInList(work);
    });

    this.#workoutsArr = storedData;
  }

  reset() {
    localStorage.removeItem('workoutArr');
    location.reload();
  }
}

const app = new App();


