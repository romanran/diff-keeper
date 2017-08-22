var
  webdriver = require('selenium-webdriver');

"use strict";
describe("Selenium Test", function () {
  var driver;

  before(function (done) {
    driver = new webdriver.Builder().
      usingServer('http://127.0.0.1:4444/wd/hub').
      withCapabilities(webdriver.Capabilities.chrome()).
      build();

    done();
  });

  it("should perform a Selenium test",  function (done) {
    this.timeout(5000);

			driver.Type("css=div.mobile-hidden.tablet-hidden > #searchform > input[name=\"s\"]", "rail");
			driver.Click("css=div.mobile-hidden.tablet-hidden > #searchform > div.search-form__btn_wrap > #submit");
			driver.WaitForPageToLoad("30000");
			Assert.IsTrue(Regex.IsMatch(driver.GetText("css=p"), "^Your search for \"rail\" returned [\\s\\S]* results\\.$"));
			driver.Type("css=div.mobile-hidden.tablet-hidden > #searchform > input[name=\"s\"]", "qwertyuiop");
			driver.Click("css=div.mobile-hidden.tablet-hidden > #searchform > div.search-form__btn_wrap > #submit");
			driver.WaitForPageToLoad("30000");
			Assert.AreEqual("Sorry we could not find any matching content", driver.GetText("css=div.error-page-wrap.box-shadow > h2"));
			try
			{
				Assert.IsTrue(driver.IsElementPresent("link=Go to homepage"));
			}
			catch (AssertionException e)
			{
				verificationErrors.Append(e.Message);
			}
			try
			{
				Assert.IsTrue(driver.IsElementPresent("link=National Rail Enquiries."));
			}
			catch (AssertionException e)
			{
				verificationErrors.Append(e.Message);
			}
			try
			{
				Assert.IsTrue(driver.IsElementPresent("link=click here"));
			}
			catch (AssertionException e)
			{
				verificationErrors.Append(e.Message);
			}
  });


  after(function (done) {
    driver.quit();
    driver.wait(function () {
      done();
    }, 5000);
  });
});
