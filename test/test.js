var assert = require('chai').assert;
var wcf2xml = require('../index');

function test(buf, check){
  assert.equal(wcf2xml.decode(new Buffer(buf, 'hex'), '', ''), check);
}

describe('Function wcf2xml.decode()', function() {
  it('should process record EndElement (code 0x01)', function(){
    test('4003646F6301', '<doc></doc>');
  });
  it('should process record Comment (code 0x02)', function(){
    test('0207636F6D6D656E74', '<!--comment-->');
  });
  it('should process record Array (code 0x03)', function(){
    test('034003617272018B0333338888DDDD', '<arr>13107</arr><arr>-30584</arr><arr>-8739</arr>');
  });
  it('should process record ShortAttribute (code 0x04)', function(){
    test('4003646F630404617474728401', '<doc attr="false"></doc>');
  });
  it('should process record Attribute (code 0x05)', function(){
    test('4003646F6309037072650A687474703A2F2F616263050370726504617474728401', '<doc xmlns:pre="http://abc" pre:attr="false"></doc>');
  });
  it('should process record ShortDictionaryAttribute (code 0x06)', function(){
    test('4003646F63068A018601', '<doc role="true"></doc>');
  });
  it('should process record DictionaryAttribute (code 0x07)', function(){
    test('4003646F6309037072650A687474703A2F2F6162630703707265008601', '<doc xmlns:pre="http://abc" pre:mustUnderstand="true"></doc>');
  });
  it('should process record ShortXmlnsAttribute (code 0x08)', function(){
    test('4003646F63080A687474703A2F2F61626301', '<doc xmlns="http://abc"></doc>');
  });
  it('should process record XmlnsAttribute (code 0x09)', function(){
    test('4003646F630901700A687474703A2F2F61626301', '<doc xmlns:p="http://abc"></doc>');
  });
  it('should process record ShortDictionaryXmlns (code 0x0A)', function(){
    test('4003646F630A0401', '<doc xmlns="http://www.w3.org/2003/05/soap-envelope"></doc>');
  });
  it('should process record DictionaryXmlnsAttribute (code 0x0B)', function(){
    test('4003646F630B01700401', '<doc xmlns:p="http://www.w3.org/2003/05/soap-envelope"></doc>');
  });
  it('should process record PrefixDictionaryAttribute (code 0x0C - 0x25)', function(){
    test('4003646F630901660A687474703A2F2F616263110A980568656C6C6F01', '<doc xmlns:f="http://abc" f:Action="hello"></doc>');
    test('4003646F630901780A687474703A2F2F61626323169805776F726C6401', '<doc xmlns:x="http://abc" x:URI="world"></doc>');
  });
  it('should process record PrefixAttribute (code 0x26 - 0x3F)', function(){
    test('4003646F6309016B0A687474703A2F2F6162633004617474728601', '<doc xmlns:k="http://abc" k:attr="true"></doc>');
    test('4003646F6309017A0A687474703A2F2F6162633F03616263980378797A01', '<doc xmlns:z="http://abc" z:abc="xyz"></doc>');
  });
  it('should process record ShortElement (code 0x40)', function(){
    test('4003646F6301', '<doc></doc>');
  });
  it('should process record Element (code 0x41)', function(){
    test('410370726503646F6309037072650A687474703A2F2F61626301', '<pre:doc xmlns:pre="http://abc"></pre:doc>');
  });
  it('should process record ShortDictionaryElement (code 0x42)', function(){
    test('420E01', '<Body></Body>');
  });
  it('should process record DictionaryElement (code 0x43)', function(){
    test('43037072650E09037072650A687474703A2F2F61626301', '<pre:Body xmlns:pre="http://abc"></pre:Body>');
  });
  it('should process record PrefixDictionaryElement (code 0x44 - 0x5D)', function(){
    test('440A0901610A687474703A2F2F61626301', '<a:Action xmlns:a="http://abc"></a:Action>');
    test('56260901730A687474703A2F2F61626301', '<s:DigestMethod xmlns:s="http://abc"></s:DigestMethod>');
  });
  it('should process record PrefixElement (code 0x5E - 0x77)', function(){
    test('5E0568656C6C6F0901610A687474703A2F2F61626301', '<a:hello xmlns:a="http://abc"></a:hello>');
    test('70094D794D6573736167650901730A687474703A2F2F61626301', '<s:MyMessage xmlns:s="http://abc"></s:MyMessage>');
  });
  it('should process record ZeroText (code 0x80)', function(){
    test('4003646F6306A0038001', '<doc RequestType="0"></doc>');
  });
  it('should process record ZeroTextWithEndElement (code 0x81)', function(){
    test('400361626381', '<abc>0</abc>');
  });
  it('should process record OneText (code 0x82)', function(){
    test('4003646F6306008201', '<doc mustUnderstand="1"></doc>');
  });
  it('should process record OneTextWithEndElement (code 0x83)', function(){
    test('400361626383', '<abc>1</abc>');
  });
  it('should process record FalseText (code 0x84)', function(){
    test('4003646F6306008401', '<doc mustUnderstand="false"></doc>');
  });
  it('should process record FalseTextWithEndElement (code 0x85)', function(){
    test('400361626385', '<abc>false</abc>');
  });
  it('should process record TrueText (code 0x86)', function(){
    test('4003646F6306008601', '<doc mustUnderstand="true"></doc>');
  });
  it('should process record TrueTextWithEndElement (code 0x87)', function(){
    test('400361626387', '<abc>true</abc>');
  });
  it('should process record Int8Text (code 0x88)', function(){
    test('4003646F6306EC0188DE01', '<doc Offset="-34"></doc>');
  });
  it('should process record Int8TextWithEndElement (code 0x89)', function(){
    test('429A01897F', '<Value>127</Value>');
  });
  it('should process record Int16Text (code 0x8A)', function(){
    test('4003646F6306EC018A008001', '<doc Offset="-32768"></doc>');
  });
  it('should process record Int16TextWithEndElement (code 0x8B)', function(){
    test('429A018BFF7F', '<Value>32767</Value>');
  });
  it('should process record Int32Text (code 0x8C)', function(){
    test('4003646F6306EC018C15CD5B0701', '<doc Offset="123456789"></doc>');
  });
  it('should process record Int32TextWithEndElement (code 0x8D)', function(){
    test('429A018DFFFFFF7F', '<Value>2147483647</Value>');
  });
  it('should process record Int64Text (code 0x8E)', function(){
    test('4003646F6306EC018E000000800000000001', '<doc Offset="2147483648"></doc>');
  });
  it('should process record Int64TextWithEndElement (code 0x8F)', function(){
    test('429A018F0000000000010000', '<Value>1099511627776</Value>');
  });
  it('should process record FloatText (code 0x90)', function(){
    test('4003646F6304016190CDCC8C3F01', '<doc a="1.1"></doc>');
  });
  it('should process record FloatTextWithEndElement (code 0x91)', function(){
    test('4005507269636591CDCC0142', '<Price>32.45</Price>');
  });
  it('should process record DoubleText (code 0x92)', function(){
    test('4003646F63040161927457148B0ABF054001', '<doc a="2.71828182845905"></doc>');
  });
  it('should process record DoubleTextWithEndElement (code 0x93)', function(){
    test('4002504993112D4454FB210940', '<PI>3.14159265358979</PI>');
  });
  it('should process record DecimalText (code 0x94)', function(){
    test('4003646F630403696E74940000060000000000802D4E000000000001', '<doc int="5.123456"></doc>');
  });
  it('should process record DecimalTextWithEndElement (code 0x95)', function(){
    test('40084D617856616C75659500000000FFFFFFFFFFFFFFFFFFFFFFFF', '<MaxValue>79228162514264337593543950335</MaxValue>');
  });
  it('should process record DateTimeText (code 0x96)', function(){
    test('4003646F63066E96FF3F37F47528CA2B01', '<doc Expires="9999-12-31T23:59:59.9999999"></doc>');
  });
  it('should process record DateTimeTextWithEndElement (code 0x97)', function(){
    test('426C9700408EF95B47C808', '<Created>2006-05-17</Created>');
  });
  it('should process record Chars8Text (code 0x98)', function(){
    test('4003646F63980568656C6C6F01', '<doc>hello</doc>');
  });
  it('should process record Chars8TextWithEndElement (code 0x99)', function(){
    test('400161990568656C6C6F', '<a>hello</a>');
  });
  it('should process record Chars16Text (code 0x9A)', function(){
    test('4003646F639A050068656C6C6F01', '<doc>hello</doc>');
  });
  it('should process record Chars16TextWithEndElement (code 0x9B)', function(){
    test('4001619B050068656C6C6F', '<a>hello</a>');
  });
  it('should process record Chars32Text (code 0x9C)', function(){
    test('4003646F639C0500000068656C6C6F01', '<doc>hello</doc>');
  });
  it('should process record Chars32TextWithEndElement (code 0x9D)', function(){
    test('4001619D0500000068656C6C6F', '<a>hello</a>');
  });
  it('should process record Bytes8Text (code 0x9E)', function(){
    test('4003646F639E08000102030405060701', '<doc>AAECAwQFBgc=</doc>');
  });
  it('should process record Bytes8TextWithEndElement (code 0x9F)', function(){
    test('40064261736536349F080001020304050607', '<Base64>AAECAwQFBgc=</Base64>'); // ytes8Text  9EBytes8Text  9EBytes8Text  9EBytes8Text
  });
  it('should process record Bytes16Text (code 0xA0)', function(){
    test('4003646F63A00800000102030405060701', '<doc>AAECAwQFBgc=</doc>');
  });
  it('should process record Bytes16TextWithEndElement (code 0xA1)', function(){
    test('4006426173653634A108000001020304050607', '<Base64>AAECAwQFBgc=</Base64>'); // ytes16Text  A0Bytes16Text  A0Bytes16Text  A0Bytes16Text
  });
  it('should process record Bytes32Text (code 0xA2)', function(){
    test('4003646F63A208000000000102030405060701', '<doc>AAECAwQFBgc=</doc>');
  });
  it('should process record Bytes32TextWithEndElement (code 0xA3)', function(){
    test('4006426173653634A3080000000001020304050607', '<Base64>AAECAwQFBgc=</Base64>');
  });
  it('should process record StartListText (code 0xA4) and EndListText (code 0xA6)', function(){
    test('4003646F63040161A4887B980568656C6C6F86A601', '<doc a="123 hello true"></doc>');
  });
  it('should process record EmptyText (code 0xA8)', function(){
    test('4003646F63040161A801', '<doc a=""></doc>');
  });
  it('should process record EmptyTextWithEndElement (code 0xA9)', function(){
    test('4003646F63A9', '<doc></doc>');
  });
  it('should process record DictionaryText (code 0xAA)', function(){
    test('4003646F6304026E73AA3801', '<doc ns="http://schemas.microsoft.com/ws/2006/05/rm"></doc>');
  });
  it('should process record DictionaryTextWithEndElement (code 0xAB)', function(){
    test('400454797065ABC401', '<Type>X509v3Certificate</Type>');
  });
  it('should process record UniqueIdText (code 0xAC)', function(){
    test('4003646F63AC00112233445566778899AABBCCDDEEFF01', '<doc>urn:uuid:33221100-5544-7766-8899-aabbccddeeff</doc>');
  });
  it('should process record UniqueIdTextWithEndElement (code 0xAD)', function(){
    test('421AAD00112233445566778899AABBCCDDEEFF', '<MessageID>urn:uuid:33221100-5544-7766-8899-aabbccddeeff</MessageID>');
  });
  it('should process record TimeSpanText (code 0xAE)', function(){
    test('4003646F63AE00C4F532FFFFFFFF01', '<doc>-00:05:44</doc>'); //-PT5M44S
  });
  it('should process record TimeSpanTextWithEndElement (code 0xAF)', function(){
    test('429407AF00B08EF01B000000', '<dateTime>03:20:00</dateTime>'); //PT3H20M
  });
  it('should process record UuidText (code 0xB0)', function(){
    test('4003646F63B0000102030405060708090A0B0C0D0E0F01', '<doc>03020100-0504-0706-0809-0a0b0c0d0e0f</doc>');
  });
  it('should process record UuidTextWithEndElement (code 0xB1)', function(){
    test('40024944B1000102030405060708090A0B0C0D0E0F', '<ID>03020100-0504-0706-0809-0a0b0c0d0e0f</ID>');
  });
  it('should process record UInt64Text (code 0xB2)', function(){
    test('4003646F63B2FFFFFFFFFFFFFFFF01', '<doc>18446744073709551615</doc>');
  });
  it('should process record UInt64TextWithEndElement (code 0xB3)', function(){
    test('429A01B3FEFFFFFFFFFFFFFF', '<Value>18446744073709551614</Value>');
  });
  it('should process record BoolText (code 0xB4)', function(){
    test('4003646F63B40101', '<doc>true</doc>');
  });
  it('should process record BoolTextWithEndElement (code 0xB5)', function(){
    test('03400361727201B5050100010001', '<arr>true</arr><arr>false</arr><arr>true</arr><arr>false</arr><arr>true</arr>');
  });
  it('should process record UnicodeChars8Text (code 0xB6)', function(){
    test('4003646F63040175B60675006E00690001', '<doc u="uni"></doc>');
  });
  it('should process record UnicodeChars8TextWithEndElement (code 0xB7)', function(){
    test('400155B70675006E006900', '<U>uni</U>');
  });
  it('should process record UnicodeChars16Text (code 0xB8)', function(){
    test('4003646F630403753136B8080075006E006900320001', '<doc u16="uni2"></doc>');
  });
  it('should process record UnicodeChars16TextWithEndElement (code 0xB9)', function(){
    test('4003553136B9080075006E0069003200', '<U16>uni2</U16>');
  });
  it('should process record UnicodeChars32Text (code 0xBA)', function(){
    test('4003646F630403753332BA040000003300320001', '<doc u32="32"></doc>');
  });
  it('should process record UnicodeChars32TextWithEndElement (code 0xBB)', function(){
    test('4003553332BB0400000033003200', '<U32>32</U32>');
  });
  it('should process record QNameDictionaryText (code 0xBC)', function(){
    test('4003646F6306F006BC088E0701', '<doc http://schemas.microsoft.com/ws/2005/05/envelope/none="i:float"></doc>');
  });
  it('should process record QNameDictionaryTextWithEndElement (code 0xBD)', function(){
    test('400454797065BD129007', '<Type>s:double</Type>');
  });
});
