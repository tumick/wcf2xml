'use strict';

/**
 * Convert WCF-binary buffer to plain XML.
 *
 * "WCF Binary" (aka ".NET Binary") is the binary packed format for WCF (Windows Communication Foundation),
 * as described in this specification:
 *         http://download.microsoft.com/download/9/5/E/95EF66AF-9026-4BB0-A41D-A4F81802D92C/[MC-NBFX].pdf
 * [MC-NBFX] (PDF file)
 *
 * Usually You meet WCF-binary data when communicating with SOAP servers, configured to pack their answers to binary form.
 * Actually WCF-binary contains an XML document, and wcf2bin package allows your node.js application to convert
 * the Buffer of binary data received from server to plain XML.
 *
 * @module
 */

var dict = require('./dict').dict;
var bn = require('./bn');

var inArray = false;

/**
 * Decode WCF-binary buffer to XML text
 * @param {Buffer} buf - buffer containing binary data
 * @param {String} [indent] - indent for nested XML elements (default "  ")
 * @param {String} [linefeed] - linefeed for child elements (default "\r\n")
 * @returns {string} decoded XML text
 */
exports.decode = function(buf, indent, linefeed){
  if(indent === undefined)
    indent = "  ";
  if(linefeed === undefined)
    linefeed = "\r\n";

  // Return unassigned if buffer is unassigned
  if(!buf)
    return;

  // Return empty string if buffer is empty
  if(!buf.length)
    return "";

  var root = newRecord('root');
  var step;
  var pos = 0;
  var node = root;

  do {
    step = processRecord(buf, pos, node);
    pos = step.pos;
    node = step.node;
  } while(pos < buf.length); // If buffer is not empty yet, continue to read the next record

  checkShort(root);

  return representNode(root, indent, linefeed);
};

var chr_a = 'a'.charCodeAt(0); // ASCII code of character 'a'
var daysOffset = 719162;       // days from 01.01.0001 till 01.01.1970
var msOffset = daysOffset * 24 * 60 * 60 * 1000; // milliseconds from 01.01.0001 till 01.01.1970

// WCF-binary ranges
var rangeEndElement = [0x01];
var rangeComment = [0x02];
var rangeArray = [0x03];
var rangeShortAttribute = [0x04];
var rangeAttribute = [0x05];
var rangeShortDictionaryAttribute = [0x06];
var rangeDictionaryAttribute = [0x07];
var rangeShortXmlnsAttribute = [0x08];
var rangeXmlnsAttribute = [0x09];
var rangeShortDictionaryXmlnsAttribute = [0x0a];
var rangeDictionaryXmlnsAttribute = [0x0b];
var rangePrefixDictionaryAttribute = [0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25];
var rangePrefixAttribute = [0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f];
var rangeShortElement = [0x40];
var rangeElement = [0x41];
var rangeShortDictionaryElement = [0x42];
var rangeDictionaryElement = [0x43];
var rangePrefixDictionaryElement = [0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d];
var rangePrefixElement = [0x5e, 0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77];
var rangeZeroText = [0x80, 0x81];
var rangeOneText = [0x82, 0x83];
var rangeFalseText = [0x84, 0x85];
var rangeTrueText = [0x86, 0x87];
var rangeInt8Text = [0x88, 0x89];
var rangeInt16Text = [0x8a, 0x8b];
var rangeInt32Text = [0x8c, 0x8d];
var rangeInt64Text = [0x8e, 0x8f];
var rangeFloatText = [0x90, 0x91];
var rangeDoubleText = [0x92, 0x93];
var rangeDecimalText = [0x94, 0x95];
var rangeDateTimeText = [0x96, 0x97];
var rangeChars8Text = [0x98, 0x99];
var rangeChars16Text = [0x9a, 0x9b];
var rangeChars32Text = [0x9c, 0x9d];
var rangeBytes8Text = [0x9e, 0x9f];
var rangeBytes16Text = [0xa0, 0xa1];
var rangeBytes32Text = [0xa2, 0xa3];
var rangeStartListText = [0xa4];
var rangeEndListText = [0xa6];
var rangeEmptyText = [0xa8, 0xa9];
var rangeDictionaryText = [0xaa, 0xab];
var rangeUniqueIdText = [0xac, 0xad];
var rangeTimeSpanText = [0xae, 0xaf];
var rangeUuidText = [0xb0, 0xb1];
var rangeUInt64Text = [0xb2, 0xb3];
var rangeBoolText = [0xb4, 0xb5];
var rangeUnicodeChars8Text = [0xb6, 0xb7];
var rangeUnicodeChars16Text = [0xb8, 0xb9];
var rangeUnicodeChars32Text = [0xba, 0xbb];
var rangeQNameDictionaryText = [0xbc, 0xbd];

/**
 * Successively reads next WCF-binary record from the buffer
 * @param {Buffer} buf - the Buffer containing data
 * @param {number} pos - current position in buffer
 * @param {Object} node - current open XML-node
 * @returns {{pos: *, node: *}} new position in the buffer, new open XML-node
 */
function processRecord(buf, pos, node){
  // Check if specified count of bytes is present in the rest of buffer
  function checkLen(len){
    if(pos + len > buf.length)
      throw new Error('Broken data stream at pos ' + pos + ' (need ' + len + ' more bytes)');
  }
  // Read from buffer block of bytes in hexadecimal representation
  function hexBlock(offset, len, back){
    var res = '';
    var i;
    if(back)
      for(i = len - 1; i >= 0; i--)
        res += byte(buf[pos + offset + i].toString(16));
    else
      for(i = 0; i < len; i++)
        res += byte(buf[pos + offset + i].toString(16));
    return res;
  }
  // Read 16-bytes UID from buffer
  function readUid(){
    checkLen(16);
    var res = hexBlock(0, 4, true) + '-' + hexBlock(4, 2, true) + '-' + hexBlock(6, 2, true) + '-' + hexBlock(8, 2) + '-' + hexBlock(10, 6);
    pos += 16;
    return res;
  }
  // Read MultibyteInt31 (WCF-binary format of variable length integer)
  function readMultibyteInt31(){
    var bytes = [];
    var b;
    do {
      checkLen(1);
      b = buf[pos++];
      bytes.unshift(b & 0x7f);
    } while(((b & 0x80) != 0) && (bytes.length < 5));
    return bytes.reduce(function(res, item){ return res * 128 + item; }, 0);
  }
  // Read String WCF-binary format from buffer
  function readString(){
    var len = readMultibyteInt31();
    checkLen(len);
    var res = buf.slice(pos, pos + len).toString(); //utf8
    pos += len;
    return res;
  }
  // Read DictionaryString WCF-binary format from buffer (actually reads integer and find appropriate string in dictionary
  function readDictionaryString(){
    return dict[readMultibyteInt31()];
  }
  // Read Chars8Text or Bytes8Text format ('utf8' or undefined for Chars8Text, 'base64' for Bytes8Text)
  function readChars8String(encoding){
    checkLen(1);
    var len = buf.readUInt8(pos);
    pos++;
    checkLen(len);
    var res = buf.slice(pos, pos + len).toString(encoding); //utf8
    pos += len;
    return res;
  }
  // Read Chars16Text or Bytes16Text format ('utf8' or undefined for Chars16Text, 'base64' for Bytes16Text)
  function readChars16String(encoding){
    checkLen(2);
    var len = buf.readUInt16LE(pos);
    pos += 2;
    checkLen(len);
    var res = buf.slice(pos, pos + len).toString(encoding); //utf8
    pos += len;
    return res;
  }
  // Read Chars32Text or Bytes32Text format ('utf8' or undefined for Chars32Text, 'base64' for Bytes32Text)
  function readChars32String(encoding){
    checkLen(4);
    var len = buf.readUInt32LE(pos);
    pos += 4;
    checkLen(len);
    var res = buf.slice(pos, pos + len).toString(encoding); //utf8
    pos += len;
    return res;
  }
  // Read Time WCF-binary format from buffer
  function readTime(){
    checkLen(8);
    var low = buf.readUInt32LE(pos);
    var high = buf.readUInt32LE(pos + 4) & 0x3FFFFFFF;
    var tz = (buf[pos + 7] & 0xc0) >> 6;
    pos += 8;
    return formDateString(high, low, tz);
  }
  // Read signed 1-byte little-endian integer from buffer
  function readInt8(){
    checkLen(1);
    var int = buf.readInt8(pos);
    pos++;
    return int.toString();
  }
  // Read signed 2-bytes little-endian integer from buffer
  function readInt16(){
    checkLen(2);
    var int = buf.readInt16LE(pos);
    pos += 2;
    return int.toString();
  }
  // Read signed 4-bytes little-endian integer from buffer
  function readInt32(){
    checkLen(4);
    var int = buf.readInt32LE(pos);
    pos += 4;
    return int.toString();
  }
  // Read signed 8-bytes little-endian integer from buffer
  function readInt64(unsigned){
    checkLen(8);
    var low = buf.readInt32LE(pos);
    var high = buf.readInt32LE(pos + 4);
    pos += 8;
    return formInt64String(high, low, unsigned);
  }
  // Read 4-bytes little-endian float from buffer
  function readFloat(){
    checkLen(4);
    var flt = buf.readFloatLE(pos);
    pos += 4;
    return formSinglePrecision(flt);
  }
  // Read 8-bytes little-endian double from buffer
  function readDouble(){
    checkLen(8);
    var dbl = buf.readDoubleLE(pos);
    pos += 8;
    return dbl.toString();
  }
  // Read 16-bytes Decimal values (see [MS-OAUT], section 2.2.26)
  function readDecimal(){
    checkLen(16);
    var scale = buf.readInt8(pos + 2);
    var sign = buf.readInt8(pos + 3);
    var hi32 = buf.readUInt32LE(pos + 4);
    var lo64low = buf.readUInt32LE(pos + 8);
    var lo64high = buf.readUInt32LE(pos + 12);
    pos += 16;
    return formDecimalString(scale, sign, hi32, lo64high, lo64low);
  }
  // Read 8-bytes TimeSpanText format
  function readTimeSpan(){
    checkLen(8);
    var low = buf.readUInt32LE(pos);
    var high = buf.readUInt32LE(pos + 4);
    pos += 8;
    return formTimeSpanString(high, low);
  }
  // Read 1-byte boolean value (0 or 1)
  function readBool(){
    checkLen(1);
    var i = buf.readUInt8(pos);
    pos++;
    if(i == 0)
      return "false";
    if(i == 1)
      return "true";
    return "";
  }
  // Read Array records
  function readArrayValues(node){
    checkLen(1);
    var rtPos = pos;
    var recordType = buf[pos++];
    var count = readMultibyteInt31();
    var val;
    for(var i = 0; i < count; i++) {
      val = newRecord('value');
      if (recordType == rangeBoolText[1])
        val.value = readBool();
      else if (recordType == rangeInt16Text[1])
        val.value = readInt16();
      else if (recordType == rangeInt32Text[1])
        val.value = readInt32();
      else if (recordType == rangeInt64Text[1])
        val.value = readInt64();
      else if (recordType == rangeFloatText[1])
        val.value = readFloat();
      else if (recordType == rangeDoubleText[1])
        val.value = readDouble();
      else if (recordType == rangeDecimalText[1])
        val.value = readDecimal();
      else if (recordType == rangeDateTimeText[1])
        val.value = readTime();
      else if (recordType == rangeTimeSpanText[1])
        val.value = readTimeSpan();
      else if (recordType == rangeUuidText[1])
        val.value = readUid();
      else
        throw new Error('Unrecognized Array record type 0x' + byte(recordType.toString(16)) + ' at position ' + rtPos);
      node.values.push(val);
    }
  }

  var record, child;
  var x, pre;
  var withEndElement = false;

  // Retrieve code of current record
  var code = buf[pos++];

  // Check range the code is inside and process the record respectively
  if(rangeEndElement.indexOf(code) >= 0) {
    if(inArray) {
      inArray = false;
      node.array = true;
      readArrayValues(node);
    }
    node = node.parent;

  } else if(rangeComment.indexOf(code) >= 0){
    record = newRecord('comment');
    record.value = readString();
    record.parent = node;
    node.children.push(record);

  } else if(rangeArray.indexOf(code) >= 0){
    inArray = true;

  } else if(rangeShortAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.value = readString();
    node.attributes.push(record);
    record.parent = node;
    node = record;

  } else if(rangeAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.prefix = readString();
    record.value = readString();
    node.attributes.push(record);
    record.parent = node;
    node = record;

  } else if(rangeShortDictionaryAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.value = readDictionaryString();
    node.attributes.push(record);
    record.parent = node;
    node = record;

  } else if(rangeDictionaryAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.prefix = readString();
    record.value = readDictionaryString();
    node.attributes.push(record);
    record.parent = node;
    node = record;

  } else if(rangeShortXmlnsAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.value = 'xmlns';
    child = newRecord('value');
    child.value = readString();
    record.values.push(child);
    node.attributes.push(record);

  } else if(rangeXmlnsAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.value = 'xmlns';
    record.postfix = readString();
    child = newRecord('value');
    child.value = readString();
    record.values.push(child);
    node.attributes.push(record);

  } else if(rangeShortDictionaryXmlnsAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.value = 'xmlns';
    child = newRecord('value');
    child.value = readDictionaryString();
    record.values.push(child);
    node.attributes.push(record);

  } else if(rangeDictionaryXmlnsAttribute.indexOf(code) >= 0){
    record = newRecord('attribute');
    record.value = 'xmlns';
    record.postfix = readString();
    child = newRecord('value');
    child.value = readDictionaryString();
    record.values.push(child);
    node.attributes.push(record);

  } else if((x = rangePrefixDictionaryAttribute.indexOf(code)) >=0){
    record = newRecord('attribute');
    record.prefix = String.fromCharCode(x + chr_a);
    record.value = readDictionaryString();
    node.attributes.push(record);
    record.parent = node;
    node = record;

  } else if((x = rangePrefixAttribute.indexOf(code)) >=0){
    record = newRecord('attribute');
    record.prefix = String.fromCharCode(x + chr_a);
    record.value = readString();
    node.attributes.push(record);
    record.parent = node;
    node = record;

  } else if(rangeShortElement.indexOf(code) >= 0){
    record = newRecord('element');
    record.value = readString();
    addChildNode(node, record);
    node = record;

  } else if(rangeElement.indexOf(code) >= 0){
    record = newRecord('element');
    record.prefix = readString();
    record.value = readString();
    addChildNode(node, record);
    node = record;

  } else if(rangeShortDictionaryElement.indexOf(code) >= 0){
    record = newRecord('element');
    record.value = readDictionaryString();
    addChildNode(node, record);
    node = record;

  } else if(rangeDictionaryElement.indexOf(code) >= 0){
    record = newRecord('element');
    record.prefix = readString();
    record.value = readDictionaryString();
    addChildNode(node, record);
    node = record;

  } else if((x = rangePrefixDictionaryElement.indexOf(code)) >= 0){
    record = newRecord('element');
    record.prefix = String.fromCharCode(x + chr_a);
    record.value = readDictionaryString();
    addChildNode(node, record);
    node = record;

  } else if((x = rangePrefixElement.indexOf(code)) >= 0){
    record = newRecord('element');
    record.prefix = String.fromCharCode(x + chr_a);
    record.value = readString();
    addChildNode(node, record);
    node = record;

  } else if((x = rangeZeroText.indexOf(code)) >= 0){
    record = newRecord('value');
    record.value = "0";
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeOneText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = "1";
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeFalseText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = "false";
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeTrueText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = "true";
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeInt8Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readInt8();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeInt16Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readInt16();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeInt32Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readInt32();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeInt64Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readInt64();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeFloatText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readFloat();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeDoubleText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readDouble();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeDecimalText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readDecimal();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeDateTimeText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readTime();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeChars8Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars8String();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeChars16Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars16String();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeChars32Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars32String();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeBytes8Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars8String('base64');
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeBytes16Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars16String('base64');
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeBytes32Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars32String('base64');
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeStartListText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.flag = "StartList";
    record.value = "";
    node.processList = true;
    node.values.push(record);

  } else if((x = rangeEndListText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.flag = "EndList";
    record.value = "";
    node.processList = false;
    node.values.push(record);

  } else if((x = rangeEmptyText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = "";
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeDictionaryText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readDictionaryString();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeUniqueIdText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = 'urn:uuid:' + readUid();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeTimeSpanText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readTimeSpan();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeUuidText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readUid();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeUInt64Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readInt64(true);
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeBoolText.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readBool();
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeUnicodeChars8Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars8String('ucs2');
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeUnicodeChars16Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars16String('ucs2');
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeUnicodeChars32Text.indexOf(code)) >= 0) {
    record = newRecord('value');
    record.value = readChars32String('ucs2');
    withEndElement = x == 1;
    node.values.push(record);

  } else if((x = rangeQNameDictionaryText.indexOf(code)) >= 0) {
    record = newRecord('value');
    pre = String.fromCharCode(buf[pos++] + chr_a);
    record.value = pre + ":" + readDictionaryString();
    withEndElement = x == 1;
    node.values.push(record);

  } else {
    throw new Error('Unrecognized record code 0x' + byte(code.toString(16)) + ' at position ' + (pos - 1));
  }

  if(withEndElement || record && record.type == 'value' && (node.type == 'short' || node.type == 'attribute' && !node.processList))
    node = node.parent;

  return {
    pos: pos,
    node: node
  };
}

/**
 * Mark nodes, which have no children and only one or no values, as short (to process them in one line in the result XML)
 * @param {Object} node - the root node to process recursively
 */
function checkShort(node){
  if(node.type == 'element' && /*!node.attributes.length && */!node.children.length && node.values.length <= 1)
    node.type = 'short';
  for(var i = 0; i < node.children.length; i++)
    checkShort(node.children[i]);
}

/**
 * Text representation of given node of document structure in XML format
 * @param {Object} node - the root node to process recursively
 * @param {String} ind - the indent string
 * @param {String} lf - the linefeed string
 * @returns {String} plain representation of the node in XML
 */
function representNode(node, ind, lf){
  var i;

  if(node.type == 'value')
    return escape(node.value);

  var caption = nodeCaption(node);

  var values = '';
  var inListState = false;

  for(i = 0; i < node.values.length; i++) {
    values += representNode(node.values[i], ind, lf);
    if(node.values[i].flag == "EndList")
      inListState = false;
    else if(node.values[i].flag == "StartList")
      inListState = true;
    else
      if(inListState && i < node.values.length - 1 && node.values[i + 1].flag != "EndList")
        values += " ";
  }

  if(node.type == 'attribute')
    return caption + '="' + values + '"';

  var children = '';
  for(i = 0; i < node.children.length; i++)
    children += representNode(node.children[i], ind, lf);

  if(node.type == 'root')
    return children + values;

  var indent = new Array(calcNodeLevel(node) + 1).join(ind);

  if(node.type == 'comment')
    return indent + '<!--' + node.value + '-->' + lf;

  var start = indent + '<' + caption;
  for (i = 0; i < node.attributes.length; i++)
    start += ' ' + representNode(node.attributes[i], ind, lf);
  start += '>';

  var finish = '</' + caption + '>' + lf;

  if(node.array){
    values = '';
    for(i = 0; i < node.values.length; i++)
      values += start + node.values[i].value + finish;
    return values;
  }

  if(node.type == 'short')
    return start + children + values + finish;

  if(values)
    values = indent + ind + values + lf;

  // node.type == 'element'
  return start + lf + children + values + indent + finish;
}

// ================================== Service functions ==================================

// Returns new empty node record
function newRecord(type){
  return {
    type: type,
    prefix: '',
    postfix: '',
    value: '',
    attributes: [],
    children: [],
    values: [],
    parent: null
  };
}

// Adds child node to the parent's children array
function addChildNode(parentNode, childNode){
  parentNode.children.push(childNode);
  childNode.parent = parentNode;
}

// Escapes invalid XML character in the String
function escape(str){
  var res = '';
  var c, d;

  for(var i = 0; i < str.length; i++) {
    c = str.charAt(i);
    d = str.charCodeAt(i);
    if(c == '"')
      res += '&quot;';
    else if(c == '&')
      res += '&amp;';
    else if(c == '<')
      res += '&lt;';
    else if(c == '>')
      res += '&gt;';
    else /*if(c == "'")
     res += '&apos;';
     else */if(d < 32)
      res += '&#' + d + ';';
    else
      res += c;
  }

  return res;
}

// Calcs node level of nesting (for correct indentation)
function calcNodeLevel(node){
  if(!node.parent || node.parent.type == 'root')
    return 0;
  return calcNodeLevel(node.parent) + 1;
}

// Uses node prefix and postfix to form full XML-tag caption
function nodeCaption(node){
  var res = node.value;
  if(node.prefix)
    res = node.prefix + ':' + res;
  if(node.postfix)
    res += ':' + node.postfix;
  return res;
}

// Converts 62-bit date/time value (with 2-bit timezone mark) to it's string representation [IEEE854]
function formDateString(high, low, tz) {
  var ticks = bn.dec(bn.add(bn.shl(bn.n2a(high), 4), bn.n2a(low)));
  var ms, c;
  var ns = bn.md(ticks.slice(-4), 4);
  if(ticks.length > 4)
    ms = parseInt(ticks.slice(0, ticks.length - 4));
  else
    ms = 0;
  var res = new Date(ms - msOffset).toISOString().split('Z')[0] + ns;
  if(res.indexOf('.') > 0)
    while(res.length > 0){
      c = res.charAt(res.length - 1);
      if(c == "0" || c == ".") {
        res = res.slice(0, res.length - 1);
        if(c == ".")
          break;
      } else
        break;
    }
  if(res.slice(-9) == "T00:00:00")
    res = res.slice(0, res.length - 9);
  if(tz == 1)
    res += 'Z';
  else if (tz == 2) {
    var offset = new Date().getTimezoneOffset();
    var a;
    if(offset > 0) {
      a = '-';
    } else {
      offset = -offset;
      a = '+';
    }
    var m = offset % 60;
    res += a + dig((offset - m)/60, 2) + ':' + dig(m, 2);
  }
  return res;
}

// Javascript has no native 64-bit arithmetic, so we need to use some external functions to make string representation
// of signed and unsigned 64-bit integers
function formInt64String(high, low, unsigned){
  return bn.dec(bn.add(bn.shl(bn.n2a(high), 4), bn.n2a(low)), unsigned ? 0 : 8);
}

// Converts 96-bit Decimal value to string
function formDecimalString(scale, sign, hi32, lo64high, lo64low){
  var dec = bn.dec(bn.add(bn.add(bn.shl(bn.n2a(hi32), 8), bn.shl(bn.n2a(lo64high), 4)), bn.n2a(lo64low)));
  if(scale > 0) {
    if (scale < dec.length) {
      dec = dec.slice(0, dec.length - scale) + '.' + dec.slice(-scale);
    } else if (scale > dec.length) {
      dec = "0." + new Array(scale - dec.length + 1).join("0") + dec;
    } else /* scale == dec.length */
      dec = "0." + dec;
  }
  if(sign == 0x80)
    dec = '-' + dec;
  return dec;
}

// Converts 64-bit TimeSpan value to string
function formTimeSpanString(high, low){
  var ticks = bn.md(bn.dec(bn.add(bn.shl(bn.n2a(high), 4), bn.n2a(low)), 8), 8);
  var fs = removeTrailingZeroes(ticks.slice(-7));
  var n = ticks.slice(0, ticks.length - 7);
  var negative = n.charAt(0) == "-";
  n = parseInt(n);
  if(negative)
    n = -n;
  var ss = n % 60;
  n = (n - ss)/60;
  var mm = n % 60;
  n = (n - mm)/60;
  var hh = n % 24;
  n = (n - hh)/24;
  var res = "";
  if(n != 0)
    res += n + ".";
  res += dig(hh, 2) + ":" + dig(mm, 2) + ":" + dig(ss, 2);
  if(fs != "0")
    res += "." + fs;
  if(negative)
    res = "-" + res;
  return res;
}

// The problem of Javascript double-precision arithmetic is that it can not correctly process single-precision values.
// If we don't want to receive "1.45000002376" from 1.45, we need to discard extra digits after 7th position.
function formSinglePrecision(flt){
  var str = flt.toString();
  var res = '';
  var exp = '';
  var dig = 0;
  var i, c;
  for(i = 0; i < str.length; i++) {
    c = str.charAt(i);
    if (isDigit(c)) {
      dig++;
      if (dig <= 8)
        res += c;
    } else if (isExponentSign(c)){
      exp = str.slice(i);
      break;
    } else
      res += c;
  }
  while(res.length > 0){
    c = res.charAt(res.length - 1);
    if(c == "0" || c == ".")
      res = res.slice(0, res.length - 1);
    else
      break;
  }
  if(!hasDigits(res))
    res = "0";
  else if(exp.length)
    res += exp;
  return res;
}

function isDigit(g){
  return g >= "0" && g <= "9";
}

function isExponentSign(g){
  return g == "e" || g == "E";
}

function hasDigits(v){
  for(var i = 0; i < v.length; i++)
    if(isDigit(v.charAt(i)))
      return true;
  return false;
}

// Left-padding number with zeroes to get enough digits
function dig(n, d){
  var res = n.toString();
  while(res.length < d)
    res = "0" + res;
  return res;
}

function removeTrailingZeroes(n){
  while(n.length > 1 && n.charAt(n.length - 1) == "0")
    n = n.slice(0, n.length - 1);
  return n;
}

// Left-padding single-digit byte values with left zero
function byte(b){
  if(b.length < 2)
    b = "0" + b;
  return b;
}