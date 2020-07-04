var finalOrder = {};
var orderLineItems = {};
var finalAmount = 0;

$(document).ready(function () {
    loadProducts();

    $("#place-order-button").click(function () {
        fetch('OrderProcessingServlet', {
            method: 'POST',
            body: JSON.stringify({ 'order': finalOrder }),
            headers: { 'content-type': 'application/json' },
        })
            .then(function (response) {
                if (response.ok) {
                    console.log('Post Non Apple Payment successful !');
                } else {
                    console.log('Post Non Apple Payment Post failed !!!');
                }
            });
    });

    displaySelectedItemsDiv(false);
    disableNonApplePayButton(true);
});

function disableNonApplePayButton(disable) {
    $("#place-order-button").prop('disabled', disable);
}

function displaySelectedItemsDiv(display) {
    if (display) {
        $("#selected-products-div").show();
    } else {
        $("#selected-products-div").hide();
    }
}

function loadProducts() {
    $.getJSON('content/products.json', function (data) {
        var listItems = [];

        $.each(data, function (key, val) {
                var orderLineItem = {
                    "product": val,
                    "count": 0,
                    "countBySize": {
                        "S": 0,
                        "M": 0,
                        "L": 0
                    }
            }

            orderLineItems[orderLineItem.product.id] = orderLineItem;

            var listItem = 
                '<li>' +
                    '<a href="#">' +
                        '<img class="food-pictures" src="content/assets/productImages/' + orderLineItem.product.image + '"/>' + 
                        '<h2>' + orderLineItem.product.name + '</h2>' +
                        '<p> ' + orderLineItem.product.description + '</p>' +
                        (typeof(orderLineItem.product.options) == "undefined" ? 
                            '<p>$' + (orderLineItem.product.price / 100) + ' ea.</p>' :
                            buildOptions(orderLineItem.product.options)) + 
                    '</a>' +
                    '<a id="btn_' + orderLineItem.product.id + '_add" onclick="productAdded(this)" href="#purchase" data-rel="popup" data-position-to="window" data-transition="pop">Add</a>' +
                '</li>';

            listItems.push(listItem);
        });

        $("#all-products").append(listItems.join(''));
        // Task 2: Add the missing line. Hint: The list may need to be refreshed to reapply the styles as the list is build dynamically instead of static
        $("#all-products").listview('refresh');
    });
}

function buildOptions(options) {
    var optionsHTML = '<p>';
    var optionPrice = '<p id="selectedPrice" class="none">' + 'Please select one of the following options' + '</p>'

    $.each(options, function(size , price) {
        optionsHTML = optionsHTML +
        `<button class="sizeButton ${size}" onclick=optionOnClick("${size}",${price})>` + size + '</button>&nbsp;&nbsp;' 
    });


    optionsHTML = optionsHTML + '</p>' + optionPrice

    return optionsHTML ;
}

// handing click option
function optionOnClick(size, price) {
    var selected = document.getElementById("selectedPrice")
    
    selected.style.color = 'black';
    selected.html = price;
    selected.className = size;
    selected.innerHTML = '$' + (price / 100) + ' ea.';
}

function productAdded(component) {
    var productId = getProductId(component.id);
    var orderLineItem = orderLineItems[productId];
    var selectedOption = document.getElementById("selectedPrice")

    if( typeof(orderLineItem.product.options) != "undefined" && 
        selectedOption.className == "none" ){
        // make sure customer select size
            selectedOption.innerHTML = "Please select one of the following options";
            selectedOption.style.color = "red";
    } else {
        // increase counter by size and none option picked items
        if( typeof(orderLineItem.product.options) == "undefined"){
            orderLineItem.count = orderLineItem.count + 1;
        } else {
            orderLineItem.countBySize[`${selectedOption.className}`] += 1;
                orderLineItem.count = orderLineItem.count + 1;
        }
        orderLineItems[productId] = orderLineItem;
        calculatePrice();
        disableNonApplePayButton(false);
        repaintSelectedList();
    }
}

function productRemoved(component) {
    var productId = getProductId(component.id);
    var orderLineItem = orderLineItems[productId];

    if (orderLineItem.count > 0) {
        if( typeof(orderLineItem.product.options) == "undefined" ){
            orderLineItem.count = orderLineItem.count - 1;
        } else {
            var selectedSize = document.getElementById("selectedPrice").className
            if( orderLineItem.countBySize[selectedSize] > 0 ){
                orderLineItem.countBySize[selectedSize] -= 1;
                orderLineItem.count -= 1;
            } else {
                $.each(orderLineItem.product.options, function( size , price ) {
                    if( size != selectedSize && orderLineItem.countBySize[size] > 0 ){
                        orderLineItem.countBySize[size] -= 1;
                        orderLineItem.count -= 1;   
                    }
                })
            }
        }
        orderLineItems[productId] = orderLineItem;
        console.log(productId + " - " + orderLineItem.count);
    }
    calculatePrice();
    repaintSelectedList();
    if (orderLineItem.count == 0) disableNonApplePayButton(true);
}

function repaintSelectedList() {
    var listSelectedItems = [];
    $.each(orderLineItems, function (key, orderLineItem) {
        if (orderLineItem.count != 0) {

            var listSelectedItem = 
                '<li>' +
                    '<a href="#">' +
                        '<img class="food-pictures selected" src="content/assets/productImages/' + orderLineItem.product.image + '"/>' + 
                        '<h2>' + orderLineItem.product.name + '</h2>' +
                        '<p>Number:&nbsp' + (orderLineItem.count) + '</p>' +
                        (typeof(orderLineItem.product.options) == "undefined" ? 
                            // options none selected items list
                            '<p>$' + (orderLineItem.product.price / 100 * orderLineItem.count ).toFixed(2) + ' ea.</p>' :
                            // options selected items list
                            buildCountBySize(orderLineItem.countBySize, orderLineItem.product.options) ) +
                        '<a id="btn_' + orderLineItem.product.id + '_add" onclick="productRemoved(this)" href="#purchase" data-rel="popup" data-position-to="window" data-transition="pop">Remove</a>' +
                '</li>';

            listSelectedItems.push(listSelectedItem);
        }
    });

    $("#selected-products").empty();
    $("#selected-products").append(listSelectedItems.join(''));
    $("#selected-products").listview('refresh');

    if (listSelectedItems.length == 0) {
        displaySelectedItemsDiv(false);
    } else {
        displaySelectedItemsDiv(true);
    }
}

function buildCountBySize(countBySize, options) {
    var countHTML = '<p>'

    $.each( countBySize, function( size, count ) {
        if( count > 0 ) {
            countHTML = countHTML +
                '<div class="countContainer">' +
                    `<button id="countButton" class="countButton Decrease" onclick=DisPlayCount("${size}","-")>` + '-' + '</button>' + 
                    `<p id="calculatedCount" class=${count} >` + size + ':&nbsp;' +count + '</p>' +
                    `<button id="countButton" class="countButton Increase" onclick=DisPlayCount("${size}","+")>` + '+' + '</button>' +
                '</div>' +
                '<p>$' + (options[size] * count / 100) + 'ea.</p>'
            }
    })

    return countHTML;
}

function DisPlayCount(size,math){
    var changedValue = document.getElementById("calculatedCount").className;
    console.log(size)
    $.each(orderLineItems, function (key, orderLineItem){

        if( typeof(orderLineItem.product.options) != "undefined" ){

            if( math == '+' ) {
                orderLineItem.countBySize[size] += 1 ;
                orderLineItem.count += 1;
                changedValue ++;
            } else {
                if( math == '-') {
                    orderLineItem.countBySize[size] --;
                    orderLineItem.count --;
                    changedValue --;
                } else {
                    changedValue
                }
            }
            document.getElementById("calculatedCount").className = changedValue;
            calculatePrice();
            repaintSelectedList();
        }
    });
}

function getProductId(componentId) {
    var firstIndex = componentId.indexOf('_') + 1;
    var lastIndex = componentId.lastIndexOf('_');

    return componentId.substring(firstIndex, lastIndex);
}

function calculatePrice() {
    var subTotal = 0.0;
    var finalOrderItems = [];
    var totalBySize = 0.0;
    
    $.each(orderLineItems, function (key, orderLineItem) {
        if (orderLineItem.count != 0) {
            var options = orderLineItem.product.options
            
            if( typeof(options) == "undefined" ){
                subTotal += orderLineItem.count * orderLineItem.product.price
            } else {
                // calculate price by it's different size 
                // total price of different size = price * count by size     
                $.each( orderLineItem.countBySize, function( size, count ) {
                    totalBySize += orderLineItem.product.options[`${size}`] * count;
                })
                
                subTotal = subTotal + totalBySize;
            }
            finalOrderItems.push(orderLineItem);
        } 
    });
    var formattedSubTotal = subTotal / 100.0;

    $("#payment_amount").text("$" + formattedSubTotal);

    finalOrder = {
        "finalOrderItems": finalOrderItems,
        "subTotal": subTotal,
        "formattedSubTotal": formattedSubTotal
    };

    finalAmount = subTotal;
    console.log('Final amount : ' + finalAmount)
    console.log(JSON.stringify(finalOrder));
}

