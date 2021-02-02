# README

This extension automates provides automation for creating a Learn module based on a pre-defined pattern and for updating module structure after creation.

The Learn team has defined several standard patterns for Learn modules, each serving a different customer need:

- **Introduction** modules introduce a product or technology.
- **Choose** modules help you decide between different products or technologies.
- **Standard** modules provide an approved sequence of unit types to help learners understand and apply concepts.

The Scaffolding extension lets content developers create a module in one of these patterns in just a few clicks, instead of having to manually create the series of folders, YAML files, and Markdown files that make up a module. Each generated unit contains required metadata, templatized content, and guidance to help users craft modules that follow Learn best practices. Finally, the extension provides automation to easily update module structure, such as adding, renaming, reordering, and deleting units.

## Update your Settings to auto-populate metadata

You can set some metadata in your VS Code extension settings so it's auto-populated when you scaffold a new module.

1. In the VS Code **File** menu, select **Preferences** then **Settings**.
1. Expand **Extensions** then find **Docs Scaffolding Extension Configuration**.
1. Under **Microsoft alias**, type your Microsoft alias (without @microsoft,com) if you're a Microsoft employee. Otherwise, leave it blank.
1. Under **GitHub ID**, type your GitHub ID.
1. Under **Default prefix**, type a default prefix for your modules, such as "learn".
1. Under **Default product**, type the product your modules will generally apply to, such as "azure".
1. Leave the **Learn template repo** as specified; currently there's only one, although we might support others in the future.

Now, when you scaffold a module, the following will be auto-populated based on your sepcifications:

- `ms.author` metadata will be set to your Microsoft alias.
- `author` metadata will be set to your GitHub ID.
- `products` metadata will be set your default product.
- Module and unit UIDs will be prefixed with your default prefix.

## Create a new module based on a pre-defined pattern

1. In the VS Code file explorer, select the parent folder where you want to create a new module.
1. Right-click and select **Learn: Create new module**.
1. In the pop-up menu, select the appropriate module pattern depending on the intent of your module.
1. In the text box, specify a title for you module, using the placeholder text (such as "Introduction to {product}") as a guide.
1. Press Enter. Now you'll se a child folder for your module with the following chracteristics:
   - The folder name is the module title with certain words omitted or shortened.
   - The folder contains a `media` sub-folder for storing images.
   - The folder contains an `index.yml` file that defines the structure of the module. Some metadata is pre-populated based on your selections in Settings. The UIDs of the child units are generated based on your specified default prefix, the module title, and the standard unit titles for your chosen pattern, including placeholders you'll need to replace.
   - The folder contains unit YAML files based on the chosen pattern. Each unit file contains standard YAML structure, metadata, and if appropriate an included reference to a corresponding Markdown content file.
   - The folder contains an `includes` sub-folder with unit Markdown files. Each Markdown file contains a content template to help you write unit content according to Learn best practices.
   
  For example, here's a newly scaffolded **Choose** module with the title "Help me choose":
  
  <!-- add GIF -->

## Rename a unit

After you scaffold a new module, you'll need to rename the units to replace the placeholders.

## Add a unit

## Reorder units

## Delete a unit
