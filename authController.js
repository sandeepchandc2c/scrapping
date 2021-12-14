const stripe = require("stripe")(process.env.SECRET_KEY_STRIPE);
const User = require("./userModel");
exports.createSession = async function (req, res, next) {
  const currentUser = await User.find({ email: req.body.email });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.host}/`,
    cancel_url: `${req.protocol}://${req.host}/`,
    customer_email: currentUser.email,
    client_reference_id: req.param.userId,
    line_items: [
      {
        name: "Zillow property",
        amount: 5 * 100,
        currency: "USD",
        quantity: 1,
      },
    ],
  });
  res.status(200).send({
    status: "success",
    session,
  });
};

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
    res.status(200).send({
      status: "success",
      newUser,
    });
  } catch (err) {
    res.status(401).send({
      status: "error",
      message: err.message,
    });
  }
};

exports.logIn = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (
      !user ||
      !(await user.checkPassword(req.body.password, user.password))
    ) {
      throw new Error();
    }
    res.status(200).send({
      status: "success",
      user,
    });
  } catch (err) {
    res.status(401).send({
      status: "error",
      message: err.message,
    });
  }
};
