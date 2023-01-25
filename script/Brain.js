//Brain - это основной класс нейронных сетей. Он содержит ссылки на объекты сетевого уровня.
var Brain = (function () {

    function Brain(brainData) {
        this.Layers = [];

        //if brainData is provided, rebuild the brain based on a previous state (если данные о мозге предоставлены, перестройте мозг на основе предыдущего состояния)
        if (brainData !== null) {
            for (var i = 0; i < brainData.Layers.length; i++) {
                var layerData = brainData.Layers[i];
                var layer = new Layer();
                this.Layers.push(layer);
                for (var j = 0; j < layerData.Neurons.length; j++) {
                    var neuronData = layerData.Neurons[j];

                    var neuron = new Neuron();
                    neuron.AxonValue = neuronData.AxonValue;
                    neuron.Name = neuronData.Name;
                    layer.Neurons.push(neuron);
                    if (i > 0) {
                        //connect the neuron with all neurons in the previous layer (соедините нейрон со всеми нейронами предыдущего слоя)
                        this.Layers[i - 1].ConnectNeuron(neuron);
                    }
                    //set weights for each dendrite (установите веса для каждого дендрита)
                    for (var k = 0; k < neuronData.Dendrites.length; k++) {
                        neuron.Dendrites[k].Weight = neuronData.Dendrites[k].Weight;
                    }
                }

            }
        }
    }

    //make each layer in the network 'think' (generate output values) - заставьте каждый слой в сети "думать" (генерировать выходные значения)
    Brain.prototype.Think = function () {
        for (var i = 0; i < this.Layers.length; i++) {
            this.Layers[i].Think();
        }
    };

    //train an output neuron with some inputdata. The inputdata is considered a good example for the output neuron. - обучите выходной нейрон некоторым входным данным. Входные данные считаются хорошим примером для выходного нейрона.
    Brain.prototype.Train = function (inputData, outputNeuron) {

        //no layers, no glory - никаких слоев, никакой славы 
        if (this.Layers.length === 0) {
            return;
        }

        //fill the first layer with input data to feed the network - заполните первый слой входными данными для подачи в сеть
        var inputLayer = this.Layers[0];
        for (var i = 0; i < inputData.length; i++) {
            inputLayer.Neurons[i].AxonValue = inputData[i];
        }

        //generate output for the given inputs - генерировать выходные данные для заданных входных данных
        this.Think();

        //adjust weights using the delta - отрегулируйте веса с помощью дельты 
        //the generated output is compared to the training input: the drawing in this case. - сгенерированный результат сравнивается с входными данными обучения: в данном случае с чертежом.
        //the subtraction is the error which will be corrected by adjusting the weight. - вычитание - это ошибка, которая будет исправлена путем корректировки веса.
        var delta = 0;
        var learningRate = 0.01;
        for (var i = 0; i < outputNeuron.Dendrites.length; i++) {
            var dendrite = outputNeuron.Dendrites[i];
            delta = parseFloat(Math.max(inputData[i], 0) - outputNeuron.AxonValue);
            dendrite.Weight += parseFloat(Math.max(inputData[i], 0) * delta * learningRate);
        }

    }
    return Brain;
}
)();

//A layer is a collection of neurons. - Слой - это совокупность нейронов.
var Layer = (function () {

    //the constructor. - конструктор.
    function Layer(neuronCount) {
        var neuronsToAdd = typeof neuronCount !== "undefined" ? neuronCount : 0;
        this.Neurons = [];

        //create the requested neuron objects - создайте запрошенные объекты neuron
        for (var i = 0; i < neuronsToAdd; i++) {
            this.Neurons.push(new Neuron());
        }
    }

    //make all neurons in the layer generate an output value - заставьте все нейроны в слое генерировать выходное значение
    Layer.prototype.Think = function () {
        for (var i = 0; i < this.Neurons.length; i++) {
            this.Neurons[i].Think();
        }
    };

    //connects a neuron from another layer with all neurons in this layer - соединяет нейрон из другого слоя со всеми нейронами в этом слое
    Layer.prototype.ConnectNeuron = function (neuron) {
        for (var i = 0; i < this.Neurons.length; i++) {
            neuron.Dendrites.push(new Dendrite(this.Neurons[i]))
        }
    };

    //Search for a neuron with the supplied name - Выполните поиск нейрона с указанным именем 
    Layer.prototype.GetNeuron = function (name) {
        for (var i = 0; i < this.Neurons.length; i++) {
            if (this.Neurons[i].Name.toUpperCase() === name.toUpperCase()) {
                return this.Neurons[i];
            }
        }
        return null;
    };

    //returns the neuron with the heighest axon value in this layer - возвращает нейрон с наибольшим значением аксона в этом слое
    Layer.prototype.BestGuess = function () {
        var max = 0;
        var bestGuessIndex = 0;

        //find index of the neuron with heighest axon value - найдите индекс нейрона с наибольшим значением аксона
        for (var i = 0; i < this.Neurons.length; i++) {
            if (this.Neurons[i].AxonValue > max) {
                max = this.Neurons[i].AxonValue;
                bestGuessIndex = i;
            }
        }
        return this.Neurons[bestGuessIndex];
    }



    return Layer;
}
)();

//a neuron is the calculation unit and is responsible for generating an output value. - нейрон является вычислительной единицей и отвечает за генерацию выходного значения.
var Neuron = (function () {

    //neuron constructor. They have names for easy retrieval. - конструктор нейронов. У них есть названия для легкого поиска.
    function Neuron(name) {
        this.Name = name;
        this.Dendrites = [];
        this.AxonValue = 0.5;
    }

    //generate an output value based on the input values multiplied by the corresponding weights. - сгенерируйте выходное значение на основе входных значений, умноженных на соответствующие веса.
    //the output value is always between 0 and 1 because of the sigmoid function (http://en.wikipedia.org/wiki/Sigmoid_function) - выходное значение всегда находится между 0 и 1 из-за сигмоидной функции 
    Neuron.prototype.Think = function () {
        var sum = 0;
        if (this.Dendrites.length > 0) {
            for (var i = 0; i < this.Dendrites.length; i++) {
                sum += this.Dendrites[i].SourceNeuron.AxonValue * this.Dendrites[i].Weight;
            }

            //apply sigmoid function to transform the sum to a value between 0 and 1 - примените сигмоидальную функцию для преобразования суммы в значение от 0 до 1
            this.AxonValue = 1 / (1 + Math.exp(-sum));
        }
    };
    return Neuron;
}
)();

//A dendrite represents a an input connection to a neuron. - Дендрит представляет собой входное соединение с нейроном. 
//The source neuron it is connected to must be passed in the constructor. - Исходный нейрон, к которому он подключен, должен быть передан в конструкторе.
var Dendrite = (function () {
    function Dendrite(sourceNeuron) {
        this.SourceNeuron = sourceNeuron;
        this.Weight = 0;
    }
    return Dendrite;
}
)();
