const Vapor = @import("vapor");
const Vaporize = @import("vaporize");
const Validation = Vaporize.Validation;
const ValidationError = Vaporize.ValidationError;

const Box = Vapor.Box;
const Text = Vapor.Text;
const Compiler = @import("../main.zig");
const Select = @import("../components/Opaque.zig").Select;
const new = @import("../components/Select.zig").new;

const Currency = enum { usd, eur };

const Country = enum { US, CA, UK };

const PaymentMethod = enum { card, paypal };

const CheckoutForm = struct {
    // Account
    account: struct {
        email: []const u8 = "",
        password: []const u8 = "",
        confirm_password: []const u8 = "",
        notes: []const []const u8 = &.{},
        contact: struct {
            phone: []const u8 = "",
        } = .{},
    } = .{},

    payment: struct {
        method: []const u8 = "",
        expiry: []const u8 = "",
        cvv: []const u8 = "",
        billing_address: []const u8 = "",
        card_number: []const u8 = "",
    } = .{},

    shipping_details: struct {
        shipping_same_as_billing: Vaporize.Condition(CheckoutForm) = .{
            .callback = sameAsBilling,
            .target_field = "shipping",
        },
    } = .{},

    shipping: struct {
        address: []const u8 = "",
        country: []const u8 = "",
        state: []const u8 = "",
        city: []const u8 = "",
        postal_code: []const u8 = "",
    } = .{},

    pub const __validations = .{
        .email = Validation{ .field_type = .email },
        .password = Validation{ .field_type = .password },
        .confirm_password = Validation{ .field_type = .password, .target_field = "password", .match = true },
        .phone = Validation{ .field_type = .telephone, .depends_on = "country" },
        .card_number = Validation{ .field_type = .credit_card },
        .expiry = Validation{ .field_type = .expiry, .placeholder = "MM/YY" },
        .cvv = Validation{ .field_type = .cvv, .placeholder = "123", .err = "CVV is required" },
        .address = Validation{ .field_type = .string, .required = true },
        .city = Validation{ .field_type = .string, .required = true },
        .state = Validation{ .field_type = .string, .required = true },
        .postal_code = Validation{ .field_type = .string, .required = true },
        .notes = Validation{ .field_type = .string, .required = true, .err = "Notes are required" },
    };

    pub const __components = .{
        .method = PaymentMethodComponent,
        .country = CountryComponent,
    };
};
fn PaymentMethodComponent(_: *CheckoutForm, _: ?ValidationError) void {
    payment_method.render();
}

fn CountryComponent(_: *CheckoutForm, _: ?ValidationError) void {
    country.render();
}

fn sameAsBilling(form: *CheckoutForm) void {
    Vapor.print("sameAsBilling {any}", .{form.shipping_details.shipping_same_as_billing.value});
}

fn onSubmit(form: CheckoutForm) void {
    Vapor.print("Submitted {any}", .{form});
}

const FormCheckout = Vaporize.Form(CheckoutForm);
var login_form: FormCheckout = .{
    .on_submit = onSubmit,
    .default_value = CheckoutForm{ .account = .{ .email = "vicrokx@gmail.com" } },
};

var country: Select(Country) = undefined;
var payment_method: Select(PaymentMethod) = undefined;

pub fn init() void {
    new();
    // compile the struct into a UI form
    login_form.compile() catch unreachable;

    payment_method = .fromItems(&.{
        .{ .value = PaymentMethod.card, .label = "Card" },
        .{ .value = PaymentMethod.paypal, .label = "PayPal" },
    });
    payment_method.trigger = "Payment Method";

    country = .fromItems(&.{
        .{ .value = Country.US, .label = "United States" },
        .{ .value = Country.CA, .label = "Canada" },
        .{ .value = Country.UK, .label = "United Kingdom" },
    });
    country.trigger = "Country";
}

pub fn LoginComponent() void {
    login_form.render();
}
