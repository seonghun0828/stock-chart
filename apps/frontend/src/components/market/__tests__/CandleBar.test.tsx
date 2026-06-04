import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CandleBar } from '../CandleBar';

describe('CandleBar', () => {
  it('uses previous-close-centered upper/lower limit range for the bar scale', () => {
    render(
      <CandleBar
        price={110}
        changeRate={10}
        priceRange={{
          previousClose: 100,
          open: 95,
          high: 115,
          low: 90,
        }}
      />,
    );

    expect(screen.getByTestId('candle-tick')).toHaveStyle({ left: '50%' });
    expect(screen.getByTestId('candle-wick')).toHaveStyle({
      left: '33.33333333333333%',
      width: '41.66666666666667%',
    });
    expect(screen.getByTestId('candle-body')).toHaveStyle({
      left: '41.66666666666667%',
    });
    expect(screen.getByTestId('candle-body').getAttribute('style')).toContain(
      'width: 24.999999999999986%',
    );
  });
});
