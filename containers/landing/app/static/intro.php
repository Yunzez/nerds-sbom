<!DOCTYPE html>
<html lang="en">

<?php $title="Study - Introduction"; include('template/head.php'); ?>

<?php include('template/body.html') ?>

<hr class="featurette-divider">
<div class="row">
    <div class="col-lg-6" style="text-align: justify;">
  <h2>Introduction</h2>
  <p>
    This study looks at how you use <b>Software Bills of Materials (SBOMs)</b> to make security
    decisions about medical devices. We want to understand your workflow, the challenges you face,
    and what information you need when assessing vulnerabilities.
  </p>

  <p>
    You will work in a realistic, browser-based environment with an SBOM analysis platform, OWASP Dependency Track, and
    access to external resources. The environment is designed to reflect real scenarios and
    highlight decision points.
  </p>

  <p>
    During your session, we will observe your process and collect interaction logs (navigation,
    searches, clicks) while you think aloud. This will help us understand how you approach SBOM
    data and vulnerability triage.
  </p>

  <p>
    The goal of this study is to identify gaps in SBOM content and tools so we can recommend
    improvements that make security tasks easier and more effective for professionals like you. Thank you!
  </p>
</div>

</div>
<form id="continue_form" method="post" action="howTo.php">
    <div id="recaptcha" class="g-recaptcha"
    data-sitekey="<?php echo $reCaptchaSiteKey; ?>"
    data-size="invisible"
    data-callback="onReCaptcha"
    ></div>
    <input type="hidden" id="pid" name="pid" value="<?php echo $pid ?>">
    <input type="hidden" id="origin" name="origin" value="<?php echo $originParam ?>">
    <button type="submit" class="btn btn-default" id="submit-btn">Continue</button>
</form>

<hr class="featurette-divider">

<?php include('template/bodyend.html') ?>

<script type="text/javascript">
  $("#submit-btn").click((e) => {
    grecaptcha.execute();
    e.preventDefault();
  });

  function onReCaptcha(resp) {
      $("#continue_form")[0].submit();
  }
</script>

<script src="https://www.google.com/recaptcha/api.js" async defer></script>

<html>
