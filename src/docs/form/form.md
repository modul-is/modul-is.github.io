# Nette form with custom BS5 renderer

This library allows you to spend less time writing templates for Nette forms - it contains renderers
for the form, containers as well as all inputs. You describe the form in PHP and get Bootstrap 5
markup without writing a single line of Latte.

::: tip v2.0
Version 2.0 reworks rendering. If you are coming from v1, see
[Upgrading from v1 to v2.0](#upgrading-from-v1-to-v2-0).
:::

## Installation

```bash
composer require modul-is/form
```

Requirements: PHP 8.4+, `nette/forms` 3.3+, `nette/application` 3 or 4, Bootstrap 5.

The package ships its own JavaScript and CSS in `vendor/modul-is/form/src/js` and
`vendor/modul-is/form/src/css` - include `form.js` and `form.css` in your frontend build
(the script uses [Naja](https://naja.js.org/) for AJAX).

## Getting started

### 1. Create a form component

The easiest way to create a form is to create a component which extends `FormComponent`.
Get a prepared form instance from `getForm()`, add inputs and return it.

```php
use ModulIS\Form\Form;

class UserForm extends \ModulIS\Form\FormComponent
{
	public function createComponentForm(): Form
	{
		$form = $this->getForm();

		$form->setTitle('User');

		$form->addText('name', 'Name')
			->setRequired();

		$form->addEmail('email', 'E-mail');

		$form->addSubmit('save', 'Save');

		$form->onSuccess[] = [$this, 'formSuccess'];

		return $form;
	}


	public function prepare(): void
	{
		// set defaults, load data...
	}


	public function formSuccess(Form $form, \stdClass $values): void
	{
		// ...
	}
}
```

### 2. Render it

Register the component in your presenter and render it as any other Nette component:

```latte
{control userForm}
```

That's it - the form is rendered as a Bootstrap 5 card with a header, body and footer.

## How the form is rendered

### Groups

The form is rendered as a BS5 [card](https://getbootstrap.com/docs/5.0/components/card/) -
**each card represents one group**. Use the standard `addGroup()` to split the form into more cards.

- inputs are rendered in `card-body`
- submitters, links and buttons in `card-footer`

```php
$form->addGroup('Personal info');
$form->addText('name', 'Name');

$form->addGroup('Address');
$form->addText('street', 'Street');
```

### Render types

Every input is rendered in one of the modes of `\ModulIS\Form\Enum\RenderType`. The form sets
the default, a single input can override it.

| Render type | Result |
| --- | --- |
| `RenderType::Default` | label above the input (default) |
| `RenderType::Floating` | [floating label](https://getbootstrap.com/docs/5.0/forms/floating-labels/) |
| `RenderType::Inline` | label and input side by side |

```php
// whole form with floating labels...
$form->setRenderFloating();

// ...except this one input
$form->addText('name', 'Name')
	->setRenderDefault();
```

`CheckboxList` and `RadioList` use `\ModulIS\Form\Enum\RenderListType` instead, which adds
`Big` (tiles) and `Compact` on top of `Default`, `Floating` and `Inline`.

## Inputs

The form supports all of the default Nette inputs and adds new ones:

| Method | Description |
| --- | --- |
| `addLink()` | button with a link (e.g. reset, go back buttons) |
| `addWhisperer()` | select box with a whisperer which filters options |
| `addMultiWhisperer()` | same as whisperer, more options can be selected |
| `addDuplicator()` | container which can be duplicated many times, see [Duplicator](#duplicator) |
| `addDependentSelect()` | select box that changes its options via AJAX based on another input(s) |
| `addDependentMultiSelect()` | same as `DependentSelect`, but more options can be selected |
| `addDate()` | date input, can limit min and max date |
| `addCurrency()` | formatted numeric input, see [Currency input](#currency-input) |
| `addSlider()` | range slider, single value or an interval, see [Slider](#slider) |

### Currency input

`addCurrency()` is a numeric input that visually formats values with thousands separators
(e.g. `1 000 000`) but **returns a plain integer on submit**. The currency label is appended
to the input.

The default currency can be set globally for the whole project (e.g. in bootstrap or a DI extension):

```php
\ModulIS\Form\Control\CurrencyInput::setDefaultCurrency('CZK');
```

Per-input currency:

```php
$form->addCurrency('price', 'Price', 'EUR');
// or
$form->addCurrency('price', 'Price')->setCurrency('EUR');
```

### Slider

`addSlider()` renders a slider built on [rSlider.js](https://github.com/slawomir-zaziablo/range-slider).
The value domain is either a continuous range or an explicit list of values.

```php
// continuous range - min, max and step can be passed straight to addSlider()
$form->addSlider('age', 'Age', 0, 100, 5);

// ...or set later
$form->addSlider('age', 'Age')
	->setMinMax(0, 100, 5);

// explicit list of values
$form->addSlider('year', 'Year')
	->setItems([2020, 2021, 2022]);
```

`setRange()` turns on a second handle - the value then becomes an array `[from, to]`:

```php
$slider = $form->addSlider('span', 'Span', 0, 100, 10)
	->setRange()
	->setValue([20, 60]);

$slider->getValue(); // [20, 60]
```

Without `setRange()` the value is a single `int` or `float`:

```php
$slider = $form->addSlider('age', 'Age', 0, 100, 5)
	->setValue(35);

$slider->getValue(); // 35
```

Appearance of the slider itself:

- `showScale()` - ticks under the track (default `true`)
- `showLabels()` - value labels under the ticks (default `true`)
- `showTooltip()` - bubble with the current value above the handle (default `true`)

::: warning
`setMinMax()` and `setItems()` are mutually exclusive - the later call wins. Calling neither
throws an exception when the input is rendered.
:::

### Duplicator

A container which the user can add and remove copies of. The factory callback builds one copy,
the third argument is the number of copies rendered by default.

```php
$duplicator = $form->addDuplicator('phones', function(\ModulIS\Form\DuplicatorContainer $container)
{
	$container->addText('phone', 'Phone');

	$container->addSubmit('del', 'Remove');
}, 1);

$duplicator->addSubmit('add', 'Add phone');
```

## Custom settings

### Form

| Method | Description |
| --- | --- |
| `setTitle()` | adds `card-header` div with a title |
| `setColor()` | sets colour of the form |
| `setAjax()` | form is submitted via AJAX |
| `setRenderType()` | render type for all inputs of the form, see [Render types](#render-types) |
| `setRenderDefault()`, `setRenderFloating()`, `setRenderInline()` | shortcuts for `setRenderType()` |
| `setButtonClass()` | default CSS class for all form buttons (e.g. `rounded rounded-4`); can be overridden by `setClass()` on individual buttons |
| `setDefaultInputWrapClass()` | default class of the input wrapper (`mb-2 col-12`) |

To render the form from your own template, call `setRenderManually()` on the component,
see [Manual rendering](#manual-rendering).

### Container

A container works as a standard Nette Container and has these new features:

| Method | Description |
| --- | --- |
| `setId()` | adds html id to the outer div of the container |
| `showCard()` | shows the container as a BS5 [card](https://getbootstrap.com/docs/5.0/components/card/) |
| `setTitle()` | shows the title of the container (only when rendered as card) |
| `setColor()` | sets colour of the container (only when rendered as card) |

```php
$address = $form->addContainer('address')
	->showCard(true)
	->setTitle('Address');

$address->addText('street', 'Street');
$address->addText('city', 'City');
```

### Inputs

Some inputs provide new features:

| Method | Description | Works on |
| --- | --- | --- |
| `setIcon()` | adds an icon to the input or button | buttons, links, text inputs |
| `setColor()` | adds colour to the input or button | buttons, links, checkbox, lists |
| `setTemplate()` | custom Latte template instead of the basic render | all inputs |
| `setPrepend()` | prepend part of [input group](https://getbootstrap.com/docs/5.0/forms/input-group/) | text inputs, select boxes |
| `setAppend()` | append part of [input group](https://getbootstrap.com/docs/5.0/forms/input-group/) | text inputs, select boxes |
| `setRenderType()` | render type of a single input, overrides the form setting | all non-button inputs |
| `setRenderDefault()`, `setRenderFloating()`, `setRenderInline()` | shortcuts for `setRenderType()` | all non-button inputs |
| `setAutoRenderSkip()` | skips rendering, e.g. when rendered as part of another input's custom template | all inputs |
| `setTooltip()` | icon with a tooltip next to the caption | text inputs, checkbox, lists, select boxes |
| `setQuickCopy()` | button to copy the value to clipboard | text inputs, textarea |
| `setWrapClass()` | class of the outer div around label and input - overrides basic `col-` class | text inputs, checkbox, lists, select boxes |
| `setLabelWrapClass()` | class of the div around label - overrides basic `col-` class | text inputs, checkbox, lists, select boxes |
| `setInputWrapClass()` | class of the div around input - overrides basic `col-` class | text inputs, checkbox, lists, select boxes |

::: tip
Use `setRenderDefault()` on a single input to opt it out of a form-wide floating/inline setting.
:::

```php
$form->addText('price', 'Price')
	->setAppend('CZK')
	->setTooltip('Price including VAT')
	->setWrapClass('col-6');

$form->addText('token', 'API token')
	->setQuickCopy();
```

## Anatomy of an input

Every input is wrapped in a few nested elements and each of them has its own setter.
The trees below are the real output for `addText()` with all wrap setters used at once,
so you can see which call lands where.

### `RenderType::Default`

Label above the input.

```html
<div class="WRAP mis-field" id="WRAPID">           <!-- setWrapClass() / setWrapId() -->
    <label class="LABELWRAP">Caption</label>       <!-- setLabelWrapClass(), caption + setTooltip() -->
    <div class="input-group">
        <span class="input-group-text">PRE</span>  <!-- setPrepend() -->
        <input class="mis-input form-control INPUTWRAP">
                                                   <!-- setInputWrapClass() lands on the input itself -->
                                                   <!-- setClass() replaces the whole class attribute -->
        <span class="input-group-text">APP</span>  <!-- setAppend() -->
        <span class="quick-copy-wrap">…</span>     <!-- setQuickCopy() -->
    </div>
</div>
```

### `RenderType::Floating`

Bootstrap floating label.

```html
<div class="WRAP" id="WRAPID">                     <!-- setWrapClass() / setWrapId() -->
    <div class="input-group">
        <span class="input-group-text">PRE</span>  <!-- setPrepend() -->
        <div class="form-floating">
            <input class="form-control" placeholder="Caption">
            <label>Caption</label>                 <!-- caption + setTooltip() -->
        </div>
        <span class="input-group-text">APP</span>  <!-- setAppend() -->
        <span class="quick-copy-wrap">…</span>     <!-- setQuickCopy() -->
    </div>
</div>
```

### `RenderType::Inline`

Label and input side by side.

```html
<div class="WRAP mis-field-inline" id="WRAPID">    <!-- setWrapClass() / setWrapId() -->
    <div class="mis-field-inline-label">           <!-- fixed class -->
        <label>Caption</label>                     <!-- caption + setTooltip() -->
    </div>
    <div class="mis-field-inline-control">         <!-- fixed class -->
        <div class="input-group">
            <span class="input-group-text">PRE</span>
            <input class="form-control">
            <span class="input-group-text">APP</span>
            <span class="quick-copy-wrap">…</span>
        </div>
    </div>
</div>
```

### Checkbox and radio lists

`CheckboxList` and `RadioList` use `RenderListType` and have their own structure:

```
Default                                  Compact
<div class="WRAP mis-checklist">         <div class="WRAP mis-compact">
    <label>Caption</label>                   <label class="mis-compact-label LABELWRAP">
    <div class="mis-checklist-items">        <div class="mis-compact-items">
        <label class="checkbox">…</label>        <div class="mis-compact-field INPUTWRAP">
    </div>                                           <label>…</label>
</div>                                           </div>
                                             </div>
                                         </div>

Big (tiles)                              Inline
<div class="mis-tiles INPUTWRAP">        <div class="WRAP">
    <div class="mis-tiles-head">             <div class="ROW">            setRowClass()
        <div class="mis-tiles-title">            <div class="… LABELWRAP">
        <div class="mis-tiles-sub">              <div class="… INPUTWRAP">
    </div>                                   </div>
    <div class="mis-tiles-list">         </div>
        <label class="mis-tile">
            <span class="mis-tile-ico">  setIconArray()
            <span class="mis-tile-lbl">
            <span class="mis-tile-desc"> setTooltips()
            <span class="mis-tile-chk">
    </div>
</div>
```

### Which setter works where

Not every wrap setter is read by every render type - the table says where a call has an effect:

| Setter | Default | Floating | Inline | List: Default | List: Compact | List: Big | List: Inline |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| `setWrapClass()` | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ |
| `setWrapId()` | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ |
| `setLabelWrapClass()` | ✔ | – | – | – | ✔ | – | ✔ |
| `setInputWrapClass()` | ✔\* | – | – | – | ✔ | ✔ | ✔ |
| `setRowClass()` | – | – | – | – | – | – | ✔ |

\* in `Default` the class is appended to the `<input>` element, not to a wrapper div.

Setters that behave the same in all render types:

| Setter | Affects |
| --- | --- |
| `setClass()` | `class` of the `<input>` (replaces it, unlike `setInputWrapClass()`) |
| `setPrepend()` / `setAppend()` | `.input-group-text` before / after the input |
| `setIcon()` | icon rendered as a prepend |
| `setTooltip()` | question-mark icon next to the caption |
| `setQuickCopy()` | copy-to-clipboard button at the end of the input group |
| `setColor()` | colour class of the input / button |
| `setOption('id')` | `id` of the outermost element (same place as `setWrapId()`) |
| `setTemplate()` | replaces the whole render with your own Latte file |
| `setAutoRenderSkip()` | renders nothing |

The wrapper class defaults to `mb-2 col-12` and can be changed for the whole form with
`$form->setDefaultInputWrapClass()`.

## Manual rendering

When the automatic layout is not enough, call `setRenderManually()` in your component and the form
is rendered from your own template with the same name as the component
(e.g. `UserForm.php` → `userForm.latte`).

```php
public function createComponentForm(): Form
{
	$this->setRenderManually(true);

	$form = $this->getForm();
	// ...
}
```

### 1. Register the Latte extension

```yaml
latte:
	extensions:
		- ModulIS\Extension\FormExtension
```

### 2. Use the tags in your template

| Tag | Renders |
| --- | --- |
| `{inputRender name}` | the whole input - wrapper, label, input group and validation, exactly as `$form->getComponent('name')->render()` |
| `{inputCore name[:part]}` | only the input itself (`getCoreControl()`), without the label and wrapper |
| `{labelCore name[:part]}` | only the label (`getCoreLabel()`) |

Use `{inputRender}` when you only want to decide **where** an input goes and keep its normal look:

```html
<div class="row">
	<div class="col-6">{inputRender first_name}</div>
	<div class="col-6">{inputRender last_name}</div>
</div>
```

Use `{inputCore}` + `{labelCore}` when you need to build the markup around the input yourself:

```html
<div class="my-own-wrapper">
	{labelCore property_type /}
	{inputCore property_type}
</div>
```

::: tip
`{inputRender}` honours everything set on the input - `setRenderType()`, `setTemplate()`,
`setAutoRenderSkip()` (renders nothing) - and works for `addDuplicator()` containers as well.
It takes no `:part`; use `{inputCore}` for that.
:::

## Upgrading from v1 to v2.0

`setFloatingLabel()` and the boolean `setRenderInline()` are gone. Rendering is now driven by
`RenderType` / `RenderListType` - see [Render types](#render-types).

| v1 | v2.0 |
| --- | --- |
| `$form->setFloatingLabel()` | `$form->setRenderFloating()` |
| `$form->setRenderInline()` | unchanged (no longer takes a bool) |
| `$input->setFloatingLabel()` | `$input->setRenderFloating()` |
| `$input->setFloatingLabel(false)` | `$input->setRenderDefault()` |
| `$input->setRenderInline(false)` | `$input->setRenderDefault()` |
| `$form->addBox()` | removed, use `addGroup()` |
