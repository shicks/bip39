# BIP39 XOR

This is a [simple tool](./xor) to do bitwise binary operations on
BIP39 words without ever typing both inputs (or the output) into a
network-connected computer. The basic approach is to type one of the
input words into the text input box, which updates the table mapping
the second input word (on the left) to the result of the operation (on
the right). This can be used for "N of N" seed splitting as follows:
 1. generate N-1 random mnemonics of the same size as the seed to
    split
 2. for each word in the mnemonic, type the N-1 corresponding randomly
    generated shared words into the box (**never type any word from
    the actual seed phrase into a computer!**)
 3. scroll down the table to find the seed word in an alphabetized
    left-hand column
 4. write down the corresponding word from the right-hand column: this
    is the word for the Nth share

To reconstruct the original mnemonic from the shares, repeat steps 2-4
using N-1 of the shares, avoiding to type any words from the final
share. Because this process is self-inverting (i.e. if A maps to B,
then B maps to A), commutative, and associative, the specific lookup
order is unimportant.

For additional security, consider
 1. alternating which shares' random words are typed
 2. randomizing the order in which words are entered

# BIP39 Encrypt

The [encryption tool](./encrypt) allows entering a BIP39 mnemonic to
use as a symmetric encryption/decryption key.  Multiple shares may be
entered instead of a single primary mnemonic (in which case the shares
will be XORed together, see above).

# Disclaimer

NOTE: The author makes no warranty, express or implied, regarding the
fitness of these tool for any particular purpose, and shall not be
liable for any loss resulting from its use.  Use at your own risk.
