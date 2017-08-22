var
    webdriver = require('selenium-webdriver');

"use strict";
describe("Selenium Test", function() {
    var driver;

    before(function(done) {
        driver = new webdriver.Builder().
        usingServer('https://networkrail.co.uk').
        withCapabilities(webdriver.Capabilities.chrome()).
        build();

        done();
    });

    it("should perform a Selenium test", function(done) {
        this.timeout(5000);


        driver.Open("/");
        Assert.AreEqual("Network Rail – we run, look after and improve Britain's railway", driver.GetTitle());
        Assert.IsTrue(driver.IsElementPresent("css=div.mobile-hidden.tablet-hidden > #searchform > input[name=\"s\"]"));
        driver.Click("//div");
        Assert.IsTrue(driver.IsElementPresent("id=Layer_1"));
        try {
            Assert.IsTrue(driver.IsElementPresent("css=i.fa.fa-angle-right"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=i.fa.fa-angle-left"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=div.owl-item.active > a.home__carousel_link > div.home__carousel_item > ul.home-slider-meta > li.date > span"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=div.owl-item.active > a.home__carousel_link > div.home__carousel_item > ul.home-slider-meta > li.description"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=h2.home__big_title.info-box__title"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=View all"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Neighbours"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("xpath=(//a[contains(text(),'Passengers')])[2]"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=View our stations"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Train times (external link)"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("id=select2-station-select-container"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=h2.wgd-carousel__title"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=More stories"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Follow us on Twitter"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Visit us on Facebook"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Home"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        Assert.AreEqual("Who we are", driver.GetText("css=#menu-item-307 > a"));
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Property and retail"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Media"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=#menu-item-4087 > a"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("css=h6.for-you.footer__socials_title"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("//footer[@id='footer']/div/div/div[2]/div[2]/ul/li/a/span/i[2]"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("//footer[@id='footer']/div/div/div[2]/div[2]/ul/li[2]/a/span/i[2]"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("//footer[@id='footer']/div/div/div[2]/div[2]/ul/li[3]/a/span/i[2]"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("//footer[@id='footer']/div/div/div[2]/div[2]/ul/li[4]/a/span/i[2]"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Modern Slavery Statement"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
        try {
            Assert.IsTrue(driver.IsElementPresent("link=Visit our old website"));
        } catch (e) {
            verificationErrors.Append(e.Message);
        }
    });


    after(function(done) {
        driver.quit();
        driver.wait(function() {
            done();
        }, 5000);
    });
});