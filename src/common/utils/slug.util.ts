import { TranslationDto } from '../dto/translation.dto';

export class SlugUtil {
  
  static generate(text: string | TranslationDto): string {
    if (!text) {
      return '';
    }

    let textToProcess: string;
    if (typeof text === 'string') {
      textToProcess = text;
    } else {
      textToProcess = text.ua || text.ru || text.en || '';
    }

    if (!textToProcess) {
      return '';
    }

    return textToProcess
      .toString()
      .toLowerCase()
      .trim()
      
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
          ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
          н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
          ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
          ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
        };
        return map[char] || char;
      })
      
      .replace(/[^\w\s-]/g, '')
      
      .replace(/[\s_-]+/g, '-')
      
      .replace(/^-+|-+$/g, '');
  }

  
  static generateUnique(text: string, existingSlugs: string[] = []): string {
    let slug = this.generate(text);
    const baseSlug = slug;
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  
  static isValid(slug: string): boolean {
    if (!slug) {
      return false;
    }

    
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 100;
  }
}



