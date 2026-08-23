export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number) => {
    if (n === 0) {
      return '';
    }
    let res = '';
    if (n >= 100) {
      res += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        res += a[n];
      } else {
        res += b[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) {
          res += a[n % 10];
        }
      }
    }
    return res;
  };

  const numString = num.toString();
  const match = numString.match(/^(\d+)(\.\d+)?$/);
  
  if (!match) return '';

  let wholeNumber = parseInt(match[1]);
  const decimalPart = match[2] ? parseInt(match[2].substring(1).padEnd(2, '0').substring(0, 2)) : 0;

  if (wholeNumber === 0 && decimalPart === 0) {
      return 'Zero';
  }

  let words = '';

  if (wholeNumber >= 10000000) {
      words += convertLessThanOneThousand(Math.floor(wholeNumber / 10000000)) + 'Crore ';
      wholeNumber %= 10000000;
  }
  if (wholeNumber >= 100000) {
      words += convertLessThanOneThousand(Math.floor(wholeNumber / 100000)) + 'Lakh ';
      wholeNumber %= 100000;
  }
  if (wholeNumber >= 1000) {
      words += convertLessThanOneThousand(Math.floor(wholeNumber / 1000)) + 'Thousand ';
      wholeNumber %= 1000;
  }
  if (wholeNumber > 0) {
      words += convertLessThanOneThousand(wholeNumber);
  }

  let result = words.trim();
  
  if (decimalPart > 0) {
      result += ' and ' + convertLessThanOneThousand(decimalPart) + 'Paise';
  }

  return 'Rs. ' + result + ' Only';
}
