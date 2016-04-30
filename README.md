# wcf2xml

Convert WCF-binary buffer to plain XML.

"WCF Binary" (aka ".NET Binary") is the binary packed format for WCF (Windows Communication Foundation), as described in this specification: [MC-NBFX]. (PDF file from _microsoft.com_)

Usually You meet WCF-binary data when communicating with SOAP servers, configured to pack their answers to binary form.
Actually WCF-binary contains an XML document, and _wcf2xml_ package allows your *node.js* application to convert the Buffer of binary data received from server to plain XML.

Example of WCF-binary packed data:

![data-image]

Will be decoded to this XML text:

```xml
<s:Envelope xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  <s:Header>
    <a:Action s:mustUnderstand="1">action</a:Action>
  </s:Header>
  <s:Body>
    <Inventory>0</Inventory>
  </s:Body>
</s:Envelope>
```

## Installation

```sh
$ npm install wcf2xml
```

## API

```js
var w2x = require('wcf2xml');
var buf = ... // Buffer of data received from server or read from file
var xml = w2x.decode(buf);  // decoded XML in String
``` 

You receive XML as `String` to your local variable `xml`.

### decode(buffer, [indent], [linefeed])

Parameter `buffer` gets the `Buffer` object containing binary data.

Optional parameter `indent` has default value `"  "` (two spaces). It is used to indent nested XML elements.

Optional parameter `linefeed` has default value `"\r\n"` (CR-LF in Windows' style). It is used to divide child elements inside parent, and also parent's start and finish tags.

If You want, for example, retrieve single-line XML text without any indenting or dividing, pass `""` to both optional parameters.

## Tests

Package contains [mocha] _test.js_ unit in _test_ folder.

If You want to contribute the package, use this command to run tests (You will need _mocha_ installed):

```sh
$ npm test
```

## TODO

### function encode()

It seems logical to add some `encode()` function to encode an XML to binary format. But I have 2 problems with this:

1) I do not need such a functionality right now.

2) Generally plain XML doesn't contain enough information for monosemantic encoding, e.g. `<data>123</data>` can mean Int8 data, Int16, Int32, Int64, UInt64, Chars8, Bytes8 etc. My very first idea is to use some additional marks, e.g. `<data>[Int16]123</data>`, but it is not as beautiful solution as I would like to see. If You have any better ideas, You are welcome.

### test coverage

It would be great to cover function `decode()` with full set of tests, including all border conditions for all record types.

## License

[ISC](LICENSE) 

[data-image]: http://i.stack.imgur.com/sTfsf.png
[MC-NBFX]: http://download.microsoft.com/download/9/5/E/95EF66AF-9026-4BB0-A41D-A4F81802D92C/[MC-NBFX].pdf
[mocha]: https://github.com/mochajs/mocha
