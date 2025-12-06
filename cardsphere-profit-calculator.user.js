// ==UserScript==
// @name         Cardsphere Profit Calculator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Calculate actual profit after shipping costs for Cardsphere packages
// @author       You
// @match        https://www.cardsphere.com/send
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Shipping costs
    const SHIPPING_US = 0.78;
    const SHIPPING_INTERNATIONAL = 1.70;

    function calculateProfits() {
        // Find all packages
        const packages = document.querySelectorAll('.cs-package.package');

        packages.forEach(pkg => {
            // Find the flag icon to determine country
            const flagIcon = pkg.querySelector('.flag-icon');
            if (!flagIcon) return;

            const country = flagIcon.getAttribute('data-original-title');
            const isUS = country === 'United States of America';
            const shippingCost = isUS ? SHIPPING_US : SHIPPING_INTERNATIONAL;

            // Find the package heading div that contains prices
            const packageHeading = pkg.querySelector('.package-heading');
            if (!packageHeading) return;

            // Find the offer price (strong.with-bg in the second div)
            const priceDivs = packageHeading.querySelectorAll('div');
            if (priceDivs.length < 2) return;

            const priceDiv = priceDivs[1];
            const offerPriceElement = priceDiv.querySelector('strong.with-bg');
            if (!offerPriceElement) return;

            const offerPriceText = offerPriceElement.textContent.trim();
            const offerPrice = parseFloat(offerPriceText.replace('$', ''));

            // Find the efficiency index to extract market price
            const efficiencyElement = priceDiv.querySelector('.efficiency-index.with-bg');
            if (!efficiencyElement) return;

            const efficiencyText = efficiencyElement.textContent.trim();
            // Parse "249% of $0.51" to get market price
            const marketPriceMatch = efficiencyText.match(/of\s+\$(\d+\.\d+)/);
            if (!marketPriceMatch) return;

            const marketPrice = parseFloat(marketPriceMatch[1]);

            // Calculate post-shipping values
            const postShippingPrice = offerPrice - shippingCost;
            const postShippingPercent = (postShippingPrice / marketPrice * 100).toFixed(0);

            // Check if we've already added the post-shipping info
            if (priceDiv.querySelector('.post-shipping-info')) return;

            // Create new elements to display post-shipping values
            const postShippingDiv = document.createElement('div');
            postShippingDiv.className = 'post-shipping-info';
            postShippingDiv.style.color = '#28a745'; // Green color
            postShippingDiv.style.marginTop = '5px';

            const priceSpan = document.createElement('strong');
            priceSpan.textContent = `$${postShippingPrice.toFixed(2)}`;
            priceSpan.style.color = '#28a745';

            const percentSpan = document.createElement('span');
            percentSpan.textContent = ` ${postShippingPercent}% of $${marketPrice.toFixed(2)}`;
            percentSpan.style.color = '#28a745';
            percentSpan.style.marginLeft = '5px';

            postShippingDiv.appendChild(priceSpan);
            postShippingDiv.appendChild(percentSpan);

            // Add after the efficiency index
            priceDiv.appendChild(document.createElement('br'));
            priceDiv.appendChild(postShippingDiv);
        });
    }

    // Run when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', calculateProfits);
    } else {
        calculateProfits();
    }

    // Also run after a short delay to catch any dynamically loaded content
    setTimeout(calculateProfits, 1000);

    // Watch for changes to the package list (in case it's dynamically updated)
    const observer = new MutationObserver(() => {
        calculateProfits();
    });

    const packagesContainer = document.querySelector('.cs-row.packages');
    if (packagesContainer) {
        observer.observe(packagesContainer, {
            childList: true,
            subtree: true
        });
    }
})();
